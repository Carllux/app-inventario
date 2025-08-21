# backend/inventory/management/commands/seed_data.py
import random
import os
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.core.files import File
from django.conf import settings
from django.contrib.auth.models import User, Group
from django.utils import timezone
from faker import Faker
from inventory.models import (
    Branch, Sector, Location, UserProfile, Supplier, CategoryGroup, 
    Category, Item, MovementType, StockItem, StockMovement, SystemSettings
)
import unicodedata

fake = Faker('pt_BR')

def remove_accents(input_str):
    """Remove acentos de uma string"""
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return ''.join([c for c in nfkd_form if not unicodedata.combining(c)])

class Command(BaseCommand):
    help = 'Popula o banco de dados com dados de teste'

    def add_arguments(self, parser):
        parser.add_argument('--users', type=int, default=10, help='Número de usuários a criar')
        parser.add_argument('--items', type=int, default=50, help='Número de itens a criar')
        parser.add_argument('--movements', type=int, default=100, help='Número de movimentos a criar')

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Iniciando a criação de dados de teste...'))
        
        # Verificar se a pasta de imagens existe
        self.seed_images_path = os.path.join(settings.BASE_DIR, 'seed_images')
        self.available_images = self._get_available_images()
        
        # Limpar dados existentes (cuidado em produção!)
        self._clear_data()
        
        # Criar grupos
        groups = self._create_groups()
        
        # Criar filiais
        branches = self._create_branches()
        
        # Criar setores
        sectors = self._create_sectors(branches)
        
        # Criar usuários
        users = self._create_users(options['users'], groups)
        
        # Criar perfis de usuário
        self._create_user_profiles(users, branches, sectors)
        
        # Criar fornecedores
        suppliers = self._create_suppliers()
        
        # Criar categorias
        category_groups, categories = self._create_categories()
        
        # Criar locais
        locations = self._create_locations(branches)
        
        # Criar tipos de movimento
        movement_types = self._create_movement_types(groups)
        
        # Criar itens
        items = self._create_items(options['items'], categories, suppliers, branches)
        
        # Criar estoques iniciais
        self._create_initial_stocks(items, locations)
        
        # Criar movimentos de estoque
        self._create_stock_movements(options['movements'], items, locations, movement_types, users)
        
        # Criar configurações do sistema
        self._create_system_settings(branches, sectors)
        
        self.stdout.write(self.style.SUCCESS('Dados de teste criados com sucesso!'))

    def _get_available_images(self):
        """Obtém a lista de imagens disponíveis na pasta seed_images"""
        available_images = []
        if os.path.exists(self.seed_images_path):
            for file_name in os.listdir(self.seed_images_path):
                if file_name.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.gif')):
                    available_images.append(file_name)
        
        self.stdout.write(self.style.SUCCESS(f'Encontradas {len(available_images)} imagens em seed_images'))
        return available_images

    def _assign_random_image(self, item):
        """Atribui uma imagem aleatória a um item, se disponível"""
        if self.available_images and random.choice([True, False, False]):  # 33% de chance de ter imagem
            image_name = random.choice(self.available_images)
            image_path = os.path.join(self.seed_images_path, image_name)
            
            try:
                with open(image_path, 'rb') as image_file:
                    item.photo.save(
                        f"item_{item.sku}_{image_name}",
                        File(image_file),
                        save=False
                    )
                self.stdout.write(self.style.SUCCESS(f'Imagem atribuída ao item: {item.sku}'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Erro ao atribuir imagem ao item {item.sku}: {e}'))

    def _clear_data(self):
        """Limpa dados existentes (cuidado em produção!)"""
        # Remova a limpeza de UserProfile primeiro para evitar problemas de FK
        StockMovement.objects.all().delete()
        StockItem.objects.all().delete()
        Item.objects.all().delete()
        MovementType.objects.all().delete()
        Category.objects.all().delete()
        CategoryGroup.objects.all().delete()
        Supplier.objects.all().delete()
        Location.objects.all().delete()
        Sector.objects.all().delete()
        Branch.objects.all().delete()
        SystemSettings.objects.all().delete()
        
        # Agora limpe UserProfile e Users
        UserProfile.objects.all().delete()
        User.objects.exclude(username='admin').delete()

    def _create_groups(self):
        """Cria grupos de usuários"""
        groups_data = [
            ('Administradores', 'Grupo com permissões totais no sistema'),
            ('Gerentes', 'Grupo com permissões de gerenciamento'),
            ('Operadores', 'Grupo com permissões básicas de operação'),
            ('Auditores', 'Grupo com permissões de visualização apenas'),
        ]
        
        groups = []
        for name, description in groups_data:
            group, created = Group.objects.get_or_create(name=name)
            if created:
                group.description = description
                group.save()
                groups.append(group)
                self.stdout.write(self.style.SUCCESS(f'Grupo criado: {name}'))
            else:
                groups.append(group)
                self.stdout.write(self.style.SUCCESS(f'Grupo já existe: {name}'))
        
        return groups

    def _create_branches(self):
        """Cria filiais"""
        branches_data = [
            ('Matriz', 'Filial principal da empresa'),
            ('Filial SP', 'Filial localizada em São Paulo'),
            ('Filial RJ', 'Filial localizada no Rio de Janeiro'),
            ('Filial MG', 'Filial localizada em Minas Gerais'),
        ]
        
        branches = []
        for name, description in branches_data:
            branch, created = Branch.objects.get_or_create(
                name=name,
                defaults={
                    'description': description,
                    'created_by': None,
                    'last_updated_by': None
                }
            )
            if created:
                branches.append(branch)
                self.stdout.write(self.style.SUCCESS(f'Filial criada: {name}'))
            else:
                branches.append(branch)
                self.stdout.write(self.style.SUCCESS(f'Filial já existe: {name}'))
        
        return branches

    def _create_sectors(self, branches):
        """Cria setores para cada filial"""
        sectors_data = [
            'Almoxarifado',
            'Producao',
            'Expedicao',
            'Recebimento',
            'Qualidade',
        ]
        
        sectors = []
        for branch in branches:
            for sector_name in sectors_data:
                sector, created = Sector.objects.get_or_create(
                    branch=branch,
                    name=f"{sector_name} - {branch.name}",
                    defaults={
                        'description': f"Setor de {sector_name} da {branch.name}",
                        'created_by': None,
                        'last_updated_by': None
                    }
                )
                if created:
                    sectors.append(sector)
                    self.stdout.write(self.style.SUCCESS(f'Setor criado: {sector.name}'))
                else:
                    sectors.append(sector)
                    self.stdout.write(self.style.SUCCESS(f'Setor já existe: {sector.name}'))
        
        return sectors

    def _create_users(self, count, groups):
        """Cria usuários"""
        users = []
        
        # Criar um superusuário admin se não existir
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@empresa.com',
                'first_name': 'Administrador',
                'last_name': 'do Sistema',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            users.append(admin_user)
            self.stdout.write(self.style.SUCCESS('Usuário admin criado'))
        else:
            users.append(admin_user)
            self.stdout.write(self.style.SUCCESS('Usuário admin já existe'))
        
        # Criar usuários regulares
        for i in range(count):
            first_name = fake.first_name()
            last_name = fake.last_name()
            username = f"{first_name.lower()}.{last_name.lower()}"
            email = f"{username}@empresa.com"
            
            # Verificar se o usuário já existe
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name,
                    'is_staff': random.choice([True, False]),
                    'is_active': True
                }
            )
            
            if created:
                user.set_password('senha123')
                user.save()
                
                # Atribuir usuário a grupos aleatórios
                user_groups = random.sample(list(groups), random.randint(1, 2))
                user.groups.set(user_groups)
                
                users.append(user)
                self.stdout.write(self.style.SUCCESS(f'Usuário criado: {username}'))
            else:
                users.append(user)
                self.stdout.write(self.style.SUCCESS(f'Usuário já existe: {username}'))
        
        return users

    def _create_user_profiles(self, users, branches, sectors):
        """Cria perfis de usuário"""
        managers = []
        
        for user in users:
            # Verificar se já existe um perfil para este usuário
            if hasattr(user, 'profile'):
                self.stdout.write(self.style.SUCCESS(f'Perfil já existe para: {user.username}'))
                continue
            
            # Primeiros 3 usuários serão gerentes (excluindo admin)
            is_manager = len(managers) < 3 and user.username != 'admin'
            
            profile = UserProfile.objects.create(
                user=user,
                manager=random.choice(managers) if managers and not is_manager and user.username != 'admin' else None,
                job_title=random.choice([
                    'Analista de Estoques', 'Gerente de Logistica', 'Operador de Almoxarifado',
                    'Coordenador de Supply Chain', 'Auxiliar de Expedicao', 'Supervisor de Recebimento'
                ]),
                phone_number=fake.phone_number(),
                hire_date=fake.date_between(start_date='-5y', end_date='today')
            )
            
            # Atribuir filiais e setores aleatórios
            selected_branches = random.sample(list(branches), min(random.randint(1, 2), len(branches)))
            profile.branches.set(selected_branches)
            
            selected_sectors = random.sample(list(sectors), min(random.randint(1, 3), len(sectors)))
            profile.sectors.set(selected_sectors)
            
            if is_manager and user.username != 'admin':
                managers.append(profile)
            
            self.stdout.write(self.style.SUCCESS(f'Perfil criado para: {user.username}'))

    def _create_suppliers(self):
        """Cria fornecedores"""
        suppliers = []
        
        for _ in range(15):
            company_name = fake.company()
            supplier, created = Supplier.objects.get_or_create(
                name=company_name,
                defaults={
                    'tax_regime': random.choice([regime[0] for regime in Supplier.TaxRegime.choices]),
                    'cnpj': fake.cnpj() if random.choice([True, False]) else '',
                    'tax_id': str(fake.random_number(digits=10, fix_len=True)) if random.choice([True, False]) else '',
                    'contact_person': fake.name(),
                    'phone_number': fake.phone_number(),
                    'email': fake.company_email(),
                    'country': 'BR',
                    'postal_code': fake.postcode(),
                    'address_line_1': fake.street_address(),
                    'address_line_2': fake.building_number() if random.choice([True, False]) else '',
                    'neighborhood': fake.bairro(),
                    'city': fake.city(),
                    'state': fake.estado_sigla(),
                    'created_by': None,
                    'last_updated_by': None
                }
            )
            if created:
                suppliers.append(supplier)
                self.stdout.write(self.style.SUCCESS(f'Fornecedor criado: {supplier.name}'))
            else:
                suppliers.append(supplier)
                self.stdout.write(self.style.SUCCESS(f'Fornecedor já existe: {supplier.name}'))
        
        return suppliers

    def _create_categories(self):
        """Cria grupos de categorias e categorias"""
        category_groups_data = [
            ('Eletricos', 'Componentes e materiais elétricos'),
            ('Mecanicos', 'Componentes e materiais mecânicos'),
            ('Hidraulicos', 'Componentes e materiais hidráulicos'),
            ('Informatica', 'Equipamentos de informática'),
            ('Escritorio', 'Materiais de escritório'),
        ]
        
        category_groups = []
        for name, description in category_groups_data:
            group, created = CategoryGroup.objects.get_or_create(
                name=name,
                defaults={'description': description}
            )
            if created:
                category_groups.append(group)
                self.stdout.write(self.style.SUCCESS(f'Grupo de categoria criado: {name}'))
            else:
                category_groups.append(group)
                self.stdout.write(self.style.SUCCESS(f'Grupo de categoria já existe: {name}'))
        
        categories_data = {
            'Eletricos': ['Cabos', 'Conectores', 'Interruptores', 'Transformadores', 'Fusiveis'],
            'Mecanicos': ['Parafusos', 'Porcas', 'Arruelas', 'Rolamentos', 'Engrenagens'],
            'Hidraulicos': ['Mangueiras', 'Valvulas', 'Bombas', 'Conexoes', 'Vedacoes'],
            'Informatica': ['Computadores', 'Monitores', 'Teclados', 'Mouses', 'Impressoras'],
            'Escritorio': ['Papel', 'Canetas', 'Clipes', 'Grampos', 'Pastas'],
        }
        
        categories = []
        for group in category_groups:
            for category_name in categories_data[group.name]:
                category, created = Category.objects.get_or_create(
                    group=group,
                    name=category_name,
                    defaults={'description': f"{category_name} - {group.name}"}
                )
                if created:
                    categories.append(category)
                    self.stdout.write(self.style.SUCCESS(f'Categoria criada: {category_name}'))
                else:
                    categories.append(category)
                    self.stdout.write(self.style.SUCCESS(f'Categoria já existe: {category_name}'))
        
        return category_groups, categories

    def _create_locations(self, branches):
        """Cria locais de armazenamento"""
        locations = []
        location_codes = ['A01', 'A02', 'B01', 'B02', 'C01', 'C02', 'D01', 'D02']
        
        for branch in branches:
            for code in location_codes:
                location_code = f"{branch.name[:2]}-{code}"
                location, created = Location.objects.get_or_create(
                    branch=branch,
                    location_code=location_code,
                    defaults={
                        'name': f"Prateleira {code} - {branch.name}",
                        'created_by': None,
                        'last_updated_by': None
                    }
                )
                if created:
                    locations.append(location)
                    self.stdout.write(self.style.SUCCESS(f'Localização criada: {location.location_code}'))
                else:
                    locations.append(location)
                    self.stdout.write(self.style.SUCCESS(f'Localização já existe: {location.location_code}'))
        
        return locations

    def _create_movement_types(self, groups):
        """Cria tipos de movimento"""
        movement_types_data = [
            {
                'code': 'ENT_COMPRA',
                'name': 'Entrada por Compra',
                'factor': 1,
                'category': 'IN',
                'document_type': 'NF',
                'requires_approval': False,
                'affects_finance': True
            },
            {
                'code': 'ENT_DEV',
                'name': 'Entrada por Devolucao',
                'factor': 1,
                'category': 'IN',
                'document_type': 'NF',
                'requires_approval': True,
                'affects_finance': True
            },
            {
                'code': 'SAI_VENDA',
                'name': 'Saida por Venda',
                'factor': -1,
                'category': 'OUT',
                'document_type': 'NF',
                'requires_approval': False,
                'affects_finance': True
            },
            {
                'code': 'SAI_DEV',
                'name': 'Saida por Devolucao',
                'factor': -1,
                'category': 'OUT',
                'document_type': 'NF',
                'requires_approval': True,
                'affects_finance': True
            },
            {
                'code': 'AJUSTE_ENT',
                'name': 'Ajuste de Entrada',
                'factor': 1,
                'category': 'ADJ',
                'document_type': 'INT',
                'requires_approval': True,
                'affects_finance': False
            },
            {
                'code': 'AJUSTE_SAI',
                'name': 'Ajuste de Saida',
                'factor': -1,
                'category': 'ADJ',
                'document_type': 'INT',
                'requires_approval': True,
                'affects_finance': False
            },
        ]
        
        movement_types = []
        for data in movement_types_data:
            # Remover acentos do nome para passar na validação do regex
            clean_name = remove_accents(data['name'])
            
            movement_type, created = MovementType.objects.get_or_create(
                code=data['code'],
                defaults={
                    'name': clean_name,
                    'factor': data['factor'],
                    'category': data['category'],
                    'document_type': data['document_type'],
                    'requires_approval': data['requires_approval'],
                    'affects_finance': data['affects_finance'],
                    'created_by': None,
                    'last_updated_by': None
                }
            )
            
            if created:
                # Atribuir a todos os grupos
                movement_type.allowed_for_groups.set(groups)
                movement_types.append(movement_type)
                self.stdout.write(self.style.SUCCESS(f'Tipo de movimento criado: {data["code"]}'))
            else:
                movement_types.append(movement_type)
                self.stdout.write(self.style.SUCCESS(f'Tipo de movimento já existe: {data["code"]}'))
        
        return movement_types

    def _create_items(self, count, categories, suppliers, branches):
        """Cria itens"""
        items = []
        units_of_measure = ['UN', 'PC', 'CX', 'MT', 'KG', 'LT']
        
        for i in range(count):
            category = random.choice(categories)
            supplier = random.choice(suppliers)
            branch = random.choice(branches)
            
            sku = f"SKU{str(i).zfill(6)}"
            
            # Criar o item primeiro sem a imagem
            item, created = Item.objects.get_or_create(
                sku=sku,
                defaults={
                    'ean': fake.ean13() if random.choice([True, False]) else None,
                    'name': remove_accents(fake.catch_phrase()),
                    'category': category,
                    'supplier': supplier,
                    'status': random.choice([status[0] for status in Item.StatusChoices.choices]),
                    'origin': 'BR',
                    'cfop': random.choice(['5101', '5102', '5401', '5403', '5405']),
                    'brand': remove_accents(fake.company()) if random.choice([True, False]) else '',
                    'branch': branch,
                    'internal_code': f"INT{str(i).zfill(4)}",
                    'manufacturer_code': fake.bothify(text='MFG#####') if random.choice([True, False]) else '',
                    'short_description': remove_accents(fake.sentence()),
                    'long_description': remove_accents(fake.text()),
                    'warranty_days': random.randint(0, 365),
                    'purchase_price': Decimal(random.uniform(5, 500)).quantize(Decimal('0.01')),
                    'sale_price': Decimal(random.uniform(10, 600)).quantize(Decimal('0.01')),
                    'unit_of_measure': random.choice(units_of_measure),
                    'minimum_stock_level': random.randint(5, 50),
                    'height': Decimal(random.uniform(5, 100)).quantize(Decimal('0.01')) if random.choice([True, False]) else None,
                    'width': Decimal(random.uniform(5, 100)).quantize(Decimal('0.01')) if random.choice([True, False]) else None,
                    'depth': Decimal(random.uniform(5, 100)).quantize(Decimal('0.01')) if random.choice([True, False]) else None,
                    'weight': Decimal(random.uniform(0.1, 20)).quantize(Decimal('0.001')) if random.choice([True, False]) else None,
                    'created_by': None,
                    'last_updated_by': None
                }
            )
            
            if created:
                # Atribuir imagem aleatória após criar o item
                self._assign_random_image(item)
                item.save()  # Salvar novamente se uma imagem foi atribuída
                
                items.append(item)
                self.stdout.write(self.style.SUCCESS(f'Item criado: {item.name}'))
            else:
                items.append(item)
                self.stdout.write(self.style.SUCCESS(f'Item já existe: {item.name}'))
        
        return items

    def _create_initial_stocks(self, items, locations):
        """Cria estoques iniciais para os itens"""
        for item in items:
            # Cada item em 1-3 locais diferentes
            selected_locations = random.sample(list(locations), min(random.randint(1, 3), len(locations)))
            for location in selected_locations:
                stock_item, created = StockItem.objects.get_or_create(
                    item=item,
                    location=location,
                    defaults={
                        'quantity': random.randint(0, 100),
                        'created_by': None,
                        'last_updated_by': None
                    }
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f'Estoque inicial criado: {item.name} em {location.name}'))
                else:
                    self.stdout.write(self.style.SUCCESS(f'Estoque já existe: {item.name} em {location.name}'))

    def _create_stock_movements(self, count, items, locations, movement_types, users):
        """Cria movimentos de estoque"""
        for i in range(count):
            item = random.choice(items)
            location = random.choice(locations)
            movement_type = random.choice(movement_types)
            user = random.choice(users)
            
            # Garantir que movimentos de saída não excedam o estoque disponível
            stock_item = StockItem.objects.filter(item=item, location=location).first()
            if not stock_item:
                continue
                
            current_stock = stock_item.quantity
            max_quantity = current_stock if movement_type.factor == -1 else 100
            
            if max_quantity <= 0:
                continue  # Pular se não houver estoque para saída
                
            quantity = random.randint(1, max_quantity)
            
            movement = StockMovement.objects.create(
                item=item,
                location=location,
                movement_type=movement_type,
                quantity=quantity,
                unit_price=item.purchase_price if movement_type.is_inbound else item.sale_price,
                user=user,
                notes=remove_accents(fake.sentence()) if random.choice([True, False]) else ''
            )
            self.stdout.write(self.style.SUCCESS(f'Movimento criado: {movement_type.code} para {item.name}'))

    def _create_system_settings(self, branches, sectors):
        """Cria configurações do sistema"""
        settings, created = SystemSettings.objects.get_or_create(pk=1)
        settings.default_branch = random.choice(branches)
        
        # Filtrar setores que pertencem à filial padrão
        branch_sectors = [s for s in sectors if s.branch == settings.default_branch]
        if branch_sectors:
            settings.default_sector = random.choice(branch_sectors)
        
        settings.save()
        
        if created:
            self.stdout.write(self.style.SUCCESS('Configurações do sistema criadas'))
        else:
            self.stdout.write(self.style.SUCCESS('Configurações do sistema atualizadas'))