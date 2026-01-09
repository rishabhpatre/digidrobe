"""
Image Processing Service
CPU-only image analysis for clothing items
"""

import os
import io
import uuid
from PIL import Image
import numpy as np
import cv2
from sklearn.cluster import KMeans
import webcolors


class ImageProcessor:
    """Processes clothing images to extract metadata"""
    
    # Clothing category labels
    CATEGORIES = ['tops', 'bottoms', 'layers', 'shoes', 'accessories']
    
    # Style classifications
    STYLES = ['casual', 'formal', 'sporty', 'streetwear']
    
    # Season classifications  
    SEASONS = ['summer', 'winter', 'all-season']
    
    def __init__(self):
        self.rembg_session = None
        self.classifier = None
        
    def process(self, file) -> dict:
        """
        Process an uploaded image file.
        Returns detected attributes.
        """
        # Read image
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # Generate unique filename
        filename = f"{uuid.uuid4().hex}.png"
        
        # Process steps
        processed_image = self.remove_background(image)
        category = self.detect_category(image)
        colors = self.extract_colors(processed_image)
        attributes = self.detect_attributes(image, category, colors)
        
        # Save processed image
        save_path = os.path.join('uploads', filename)
        os.makedirs('uploads', exist_ok=True)
        processed_image.save(save_path, 'PNG')
        
        return {
            'imagePath': save_path,
            'category': category,
            'primaryColor': colors[0] if colors else None,
            'secondaryColor': colors[1] if len(colors) > 1 else None,
            'style': attributes.get('style'),
            'season': attributes.get('season'),
            'tags': attributes.get('tags', [])
        }
    
    def remove_background(self, image: Image.Image) -> Image.Image:
        """Remove background from clothing image using rembg"""
        try:
            from rembg import remove, new_session
            
            if self.rembg_session is None:
                # Use u2net_cloth_seg for better clothing segmentation
                self.rembg_session = new_session("u2net")
            
            result = remove(image, session=self.rembg_session)
            return result
        except Exception as e:
            print(f"Background removal failed: {e}")
            return image
    
    def detect_category(self, image: Image.Image) -> str:
        """Detect clothing category using MobileNetV2 with ImageNet classes"""
        try:
            import torch
            from torchvision import models, transforms
            
            if self.classifier is None:
                # Load pretrained MobileNetV2
                self.classifier = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
                self.classifier.eval()
            
            # Preprocess image
            preprocess = transforms.Compose([
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                )
            ])
            
            input_tensor = preprocess(image).unsqueeze(0)
            
            with torch.no_grad():
                outputs = self.classifier(input_tensor)
            
            # Get top 5 predictions for better accuracy
            probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
            top5_probs, top5_indices = torch.topk(probabilities, 5)
            
            # ImageNet class mappings for clothing items
            # Verified IDs:
            # 608: jean, blue jean, denim
            # 474: cardigan
            # 655: miniskirt
            # 610: jersey, T-shirt, tee shirt
            # 841: sweatshirt
            # 869: trench coat
            IMAGENET_CLOTHING_CLASSES = {
                # Tops
                'tops': [
                    610,  # jersey, T-shirt
                    841,  # sweatshirt
                    834,  # suit
                    452,  # bonnet (often misidentified headwear as top)
                    908,  # wing (often shirts)
                    504,  # coffee mug (sometimes graphic tees?) - removing
                ], 
                # Bottoms
                'bottoms': [
                    608,  # jean, blue jean, denim
                    655,  # miniskirt
                    689,  # overskirt
                    601,  # hoopskirt
                    697,  # pajama (often pants)
                    809,  # swimming trunks
                ],
                # Shoes
                'shoes': [
                    514,  # cowboy boot
                    770,  # running shoe, sneaker
                    753,  # radiator (bad match)
                    550,  # sandal (check ID) -> 770 is running shoe. 
                    497,  # cleat, shoe
                    518,  # clog
                    630,  # loafer
                ],
                # Layers (outerwear)
                'layers': [
                    474,  # cardigan
                    869,  # trench coat
                    568,  # fur coat
                    494,  # cloak aka chiffonier? No wait. 
                    493,  # chiffonier
                ],
                # Accessories
                'accessories': [
                    806,  # sombrero
                    902,  # whistle
                    602,  # hourglass (shape?)
                    530,  # digital watch
                ],
            }
            
            # Use class names for logging if available
            try:
                class_name = self.classifier.get_weight_metadata()['categories'][top5_indices[0]]
                print(f"Top detected class: {class_name} ({top5_indices[0]})")
            except:
                pass

            # Check top predictions against our categories
            for prob, idx in zip(top5_probs, top5_indices):
                class_id = idx.item()
                
                for category, class_ids in IMAGENET_CLOTHING_CLASSES.items():
                    if class_id in class_ids:
                        print(f"Detected category '{category}' with confidence {prob:.2%} (class {class_id})")
                        return category
            
            # If no direct match, use expanded heuristics on top prediction
            top_class = top5_indices[0].item()
            confidence = top5_probs[0].item()
            
            print(f"No direct clothing match. Top class: {top_class}, confidence: {confidence:.2%}")
            
            # Use aspect ratio as a tie-breaker for ambiguous cases
            width, height = image.size
            ratio = height / width
            print(f"Aspect ratio: {ratio:.2f}")

            # Fallback heuristics based on ImageNet structure and aspect ratio
            if 608 <= top_class <= 609: # Jeans capture
                 return 'bottoms'

            if 400 <= top_class <= 500:  # Accessories and small items range
                if top_class == 474: return 'layers' # Cardigan
                return 'accessories'
            elif 500 <= top_class <= 600:  # Footwear and lower body items
                return 'shoes'
            elif 600 <= top_class <= 700:  # Upper body clothing
                # Heuristic: If it falls int tops range but is very tall (e.g. pants that missed class 608), call it bottoms
                if ratio > 1.3: 
                    print("Class in tops range but tall aspect ratio -> guessing bottoms")
                    return 'bottoms'
                return 'tops'
            elif 800 <= top_class <= 900:  # Outerwear
                if top_class == 841: return 'tops' # Sweatshirt
                return 'layers'
            else:
                # Default fallback
                if ratio > 1.4: return 'bottoms'
                return 'tops'
                
        except Exception as e:
            print(f"Category detection failed: {e}")
            import traceback
            traceback.print_exc()
            return 'tops'  # Default fallback
    
    def extract_colors(self, image: Image.Image, n_colors: int = 3) -> list:
        """Extract dominant colors using K-means clustering"""
        try:
            # Convert to numpy array
            img_array = np.array(image)
            
            # Handle RGBA images
            if img_array.shape[-1] == 4:
                # Filter out transparent pixels
                alpha = img_array[:, :, 3]
                mask = alpha > 128
                rgb = img_array[:, :, :3]
                pixels = rgb[mask].reshape(-1, 3)
            else:
                pixels = img_array.reshape(-1, 3)
            
            if len(pixels) < n_colors:
                return []
            
            # K-means clustering
            kmeans = KMeans(n_clusters=n_colors, random_state=42, n_init=10)
            kmeans.fit(pixels)
            
            # Get colors sorted by frequency
            colors = kmeans.cluster_centers_.astype(int)
            labels, counts = np.unique(kmeans.labels_, return_counts=True)
            sorted_indices = np.argsort(-counts)
            
            # Convert to color names
            color_names = []
            for idx in sorted_indices:
                rgb = tuple(colors[idx])
                name = self._rgb_to_color_name(rgb)
                if name and name not in color_names:
                    color_names.append(name)
            
            return color_names[:2]  # Primary and secondary
            
        except Exception as e:
            print(f"Color extraction failed: {e}")
            return []
    
    def _rgb_to_color_name(self, rgb: tuple) -> str:
        """Convert RGB tuple to closest color name"""
        try:
            # Try exact match first
            return webcolors.rgb_to_name(rgb)
        except ValueError:
            # Find closest color
            min_distance = float('inf')
            closest_name = 'gray'
            
            # Simplified color palette
            colors = {
                'white': (255, 255, 255),
                'black': (0, 0, 0),
                'gray': (128, 128, 128),
                'red': (255, 0, 0),
                'blue': (0, 0, 255),
                'navy': (0, 0, 128),
                'green': (0, 128, 0),
                'yellow': (255, 255, 0),
                'orange': (255, 165, 0),
                'pink': (255, 192, 203),
                'purple': (128, 0, 128),
                'brown': (139, 69, 19),
                'beige': (245, 245, 220),
                'cream': (255, 253, 208),
                'tan': (210, 180, 140),
            }
            
            for name, color in colors.items():
                distance = sum((a - b) ** 2 for a, b in zip(rgb, color))
                if distance < min_distance:
                    min_distance = distance
                    closest_name = name
            
            return closest_name
    
    def detect_attributes(self, image: Image.Image, category: str, colors: list) -> dict:
        """Detect style and season attributes"""
        attributes = {
            'style': 'casual',
            'season': 'all-season',
            'tags': []
        }
        
        # Simple rule-based detection based on colors and category
        primary_color = colors[0].lower() if colors else ''
        
        # Style detection
        formal_indicators = ['black', 'navy', 'white', 'gray']
        sporty_indicators = ['red', 'orange', 'yellow']
        
        if primary_color in formal_indicators:
            if category in ['tops', 'bottoms']:
                attributes['style'] = 'formal'
        elif primary_color in sporty_indicators:
            attributes['style'] = 'sporty'
        
        # Season detection
        warm_colors = ['orange', 'yellow', 'red', 'pink']
        cool_colors = ['blue', 'navy', 'gray', 'black', 'brown']
        
        if primary_color in warm_colors:
            attributes['season'] = 'summer'
        elif primary_color in cool_colors:
            if category == 'layers':
                attributes['season'] = 'winter'
        
        # Generate tags
        tags = [category]
        if colors:
            tags.extend(colors[:2])
        if attributes['style']:
            tags.append(attributes['style'])
        if attributes['season']:
            tags.append(attributes['season'])
        
        attributes['tags'] = tags
        
        return attributes
