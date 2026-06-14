from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from billing.models import Category, Customer, Product, ShopSettings
from billing.services import create_bill


class Command(BaseCommand):
    help = 'Create sample supermarket data for local testing.'

    def handle(self, *args, **options):
        User = get_user_model()
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'admin12345')

        ShopSettings.objects.update_or_create(
            pk=1,
            defaults={
                'shop_name': 'Smart Supermarket',
                'shop_address': 'Main Market Road, Chennai',
                'gst_number': '29ABCDE1234F1Z5',
                'contact_number': '+91 98765 43210',
                'invoice_footer': 'Thank you for shopping with Smart Supermarket.',
            },
        )

        categories = {}
        for name in ['Grocery', 'Beverages', 'Personal Care', 'Household', 'Snacks']:
            categories[name], _ = Category.objects.get_or_create(name=name)

        products = [
            ('Basmati Rice 5kg', '890100000001', 'Grocery', 'Harvest Gold', 420, 520, 35, 8),
            ('Sunflower Oil 1L', '890100000002', 'Grocery', 'FreshDrop', 118, 145, 28, 8),
            ('Whole Wheat Atta 10kg', '890100000003', 'Grocery', 'GrainHub', 360, 450, 18, 6),
            ('Mineral Water 1L', '890100000004', 'Beverages', 'AquaPure', 12, 20, 90, 20),
            ('Orange Juice 1L', '890100000005', 'Beverages', 'FruitWay', 70, 95, 22, 6),
            ('Toothpaste 150g', '890100000006', 'Personal Care', 'BrightSmile', 68, 92, 30, 8),
            ('Shampoo 340ml', '890100000007', 'Personal Care', 'SilkCare', 145, 199, 16, 6),
            ('Dishwash Liquid 500ml', '890100000008', 'Household', 'CleanMax', 72, 105, 12, 5),
            ('Laundry Detergent 2kg', '890100000009', 'Household', 'WashPro', 210, 275, 10, 5),
            ('Potato Chips 90g', '890100000010', 'Snacks', 'Crunchy', 25, 40, 42, 12),
            ('Chocolate Cookies', '890100000011', 'Snacks', 'BakeJoy', 38, 60, 26, 10),
            ('Instant Noodles', '890100000012', 'Snacks', 'QuickBowl', 11, 16, 4, 10),
        ]
        product_objects = []
        for name, barcode, category, brand, cost, price, qty, level in products:
            product, _ = Product.objects.update_or_create(
                barcode=barcode,
                defaults={
                    'name': name,
                    'category': categories[category],
                    'brand': brand,
                    'cost_price': Decimal(cost),
                    'selling_price': Decimal(price),
                    'quantity': qty,
                    'stock_level': level,
                    'description': f'{brand} {name}',
                },
            )
            product_objects.append(product)

        customers = [
            ('Ravi Kumar', '9876500001', 'ravi@example.com'),
            ('Anita Sharma', '9876500002', 'anita@example.com'),
            ('Meera Iyer', '9876500003', 'meera@example.com'),
        ]
        for name, phone, email in customers:
            Customer.objects.get_or_create(phone=phone, defaults={'name': name, 'email': email, 'address': 'Local customer'})

        if not Product.objects.filter(bill_items__isnull=False).exists():
            create_bill({
                'customer_name': 'Ravi Kumar',
                'customer_phone': '9876500001',
                'discount': '20',
                'gst_percent': '5',
                'payment_method': 'upi',
                'items': [
                    {'product_id': product_objects[0].id, 'quantity': 1},
                    {'product_id': product_objects[3].id, 'quantity': 4},
                    {'product_id': product_objects[9].id, 'quantity': 2},
                ],
            })
            create_bill({
                'customer_name': 'Anita Sharma',
                'customer_phone': '9876500002',
                'discount': '0',
                'gst_percent': '5',
                'payment_method': 'card',
                'items': [
                    {'product_id': product_objects[5].id, 'quantity': 2},
                    {'product_id': product_objects[10].id, 'quantity': 3},
                ],
            })

        self.stdout.write(self.style.SUCCESS('Demo data ready. Login with admin / admin12345.'))
