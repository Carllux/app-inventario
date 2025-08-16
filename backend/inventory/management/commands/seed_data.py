import random
import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.core.files import File
from faker import Faker
from inventory.models import Branch, Category, Item, Location, MovementType, StockItem, StockMovement, Supplier, UserProfile, Sector
from django.conf import settings
from django.db import transaction

class Command(BaseCommand):
    help = 'Popula o banco de dados com dados de teste em massa, incluindo imagens.'

    @transaction.atomic
    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Iniciando o processo de seeding...'))

        # --- 1. Limpeza de Dados Antigos ---
        self.stdout.write('Limpando dados antigos...')
        StockMovement.objects.all().delete()
        StockItem.objects.all().delete()
        Item.objects.all().delete()
        Category.objects.all().delete()
        Supplier.objects.all().delete()
        Location.objects.all().delete()
        Sector.objects.all().delete()
        Branch.objects.all().delete()
        UserProfile.objects.filter(user__is_superuser=False).delete()
        User.objects.filter(is_superuser=False).delete()
        MovementType.objects.all().delete()
        
        # --- 2. Geração de Dados Essenciais ---
        self.stdout.write('Criando dados essenciais...')
        fake = Faker('pt_BR')

        # Garante que o superusuário 'admin' exista
        try:
            admin_user = User.objects.get(username='admin')
        except User.DoesNotExist:
            admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'admin')

        # Tipos de Movimentação (TPOs)
        entry_type = MovementType.objects.create(name='Entrada (Compra)', factor=1)
        
        # Filiais
        branches = [Branch.objects.create(name=f'Filial {fake.city()}') for _ in range(5)]
        
        # Categorias
        categories_names = ['Ferragens', 'Hidráulica', 'Elétrica', 'Ferramentas', 'Pintura']
        categories = [Category.objects.create(name=name) for name in categories_names]

        # Fornecedores
        suppliers = [Supplier.objects.create(name=fake.company(), country='BR') for _ in range(20)]

        # Locações
        locations = []
        for branch in branches:
            for i in range(10):
                locations.append(Location.objects.create(
                    branch=branch,
                    location_code=f'{branch.name[:3].upper()}-{i+1:02}',
                    name=f'Prateleira {i+1}'
                ))

        # --- 3. Lógica para Carregar Imagens ---
        self.stdout.write('Carregando imagens de amostra...')
        image_dir = os.path.join(settings.BASE_DIR, 'seed_images')
        image_files = []
        if os.path.exists(image_dir):
            image_files = [f for f in os.listdir(image_dir) if os.path.isfile(os.path.join(image_dir, f))]
        
        if not image_files:
            self.stdout.write(self.style.WARNING('Nenhuma imagem encontrada na pasta /seed_images/.'))

        # --- 4. Criação de Itens e Estoque Inicial ---
        self.stdout.write(f'Criando 200 Itens e Estoque Inicial...')
        for i in range(200):
            item = Item.objects.create(
                owner=admin_user,
                sku=f'SKU-{i+1:05}',
                name=f'{fake.bs().capitalize()}',
                category=random.choice(categories),
                supplier=random.choice(suppliers),
                purchase_price=round(random.uniform(5.0, 100.0), 2),
                sale_price=round(random.uniform(10.0, 300.0), 2),
                minimum_stock_level=random.randint(5, 20)
            )
            
            if image_files:
                random_image_name = random.choice(image_files)
                path = os.path.join(image_dir, random_image_name)
                with open(path, 'rb') as f:
                    item.photo.save(random_image_name, File(f), save=True)

            initial_quantity = random.randint(20, 200)
            StockMovement.objects.create(
                item=item,
                location=random.choice(locations),
                movement_type=entry_type,
                quantity=initial_quantity,
                user=admin_user,
                notes='Carga inicial via seeding script.'
            )

        self.stdout.write(self.style.SUCCESS('Processo de seeding concluído com sucesso!'))