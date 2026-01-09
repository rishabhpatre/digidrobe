
from torchvision.models import MobileNet_V2_Weights

weights = MobileNet_V2_Weights.IMAGENET1K_V1
categories = weights.meta["categories"]

print(f"Total categories: {len(categories)}")

# Search for clothing related terms
terms = ['jean', 'pants', 't-shirt', 'shirt', 'dress', 'skirt', 'jacket', 'coat', 'sweater', 'jersey', 'cardigan']

for i, category in enumerate(categories):
    for term in terms:
        if term in category.lower():
            print(f"Class {i}: {category}")
