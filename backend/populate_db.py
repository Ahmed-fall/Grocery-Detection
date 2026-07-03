import os
from supabase import create_client

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    print("Error: Missing credentials inside container.")
    exit(1)

supabase = create_client(supabase_url, supabase_key)

class_names = [
    "Big Ships", "Biskrem", "California GardenBeans", "Fine", "Freska", "Hohos",
    "Lifebuoy", "Maxtella", "Milk", "Nescafe Gold", "PLYMS Tuna", "Pantene Oil Replacement",
    "RedBull", "Rhodes Cheese", "Shampoo Herbal Essences", "Supermi indomie", "Toffifee",
    "V Cola", "Zabado", "bless conditioner", "cadbury dairy milk chocolate",
    "herbal essences conditioner", "juhayna mix chocolate", "nivea men deodarant",
    "oreo original", "pepsi", "pyrosol", "suntop", "tiger chilli and lemon"
]

print(f"Syncing {len(class_names)} products directly to your custom schema configuration...")

for class_id, class_name in enumerate(class_names):
    payload = {
        "class_id": int(class_id),     # Matches your int4 primary key
        "name_en": str(class_name),    # Pushes to your english name varchar
        "name_ar": str(class_name),    # Placeholder for arabic variant
        "base_price": 0.0              # Default numeric initialization value
    }
    try:
        supabase.table("products").upsert(payload).execute()
        print(f" Successfully matched class_id {class_id} -> {class_name}")
    except Exception as e:
        print(f"❌ Failed for class_id {class_id} ({class_name}): {e}")

print("\n Schema synchronized successfully!")