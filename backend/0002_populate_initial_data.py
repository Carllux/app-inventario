# backend/inventory/migrations/0002_initial_data.py
from django.db import migrations

def create_initial_data(apps, schema_editor):
    # Get models
    Branch = apps.get_model('inventory', 'Branch')
    Sector = apps.get_model('inventory', 'Sector')
    Location = apps.get_model('inventory', 'Location')
    MovementType = apps.get_model('inventory', 'MovementType')
    CategoryGroup = apps.get_model('inventory', 'CategoryGroup')
    Category = apps.get_model('inventory', 'Category')
    Supplier = apps.get_model('inventory', 'Supplier')
    SystemSettings = apps.get_model('inventory', 'SystemSettings')
    
    # Create default branch
    main_branch, created = Branch.objects.get_or_create(
        name='Matriz',
        defaults={
            'description': 'Filial principal da empresa'
        }
    )
    
    # Create default sectors
    sectors_data = [
        {'name': 'Almoxarifado', 'description': 'Setor responsável pelo estoque'},
        {'name': 'Compras', 'description': 'Setor de aquisições'},
        {'name': 'Vendas', 'description': 'Setor comercial'},
        {'name': 'Produção', 'description': 'Setor de fabricação'},
        {'name': 'Qualidade', 'description': 'Controle de qualidade'}
    ]
    
    for sector_data in sectors_data:
        Sector.objects.get_or_create(
            branch=main_branch,
            name=sector_data['name'],
            defaults={'description': sector_data['description']}
        )
    
    # Create default locations
    locations_data = [
        {'location_code': 'PRAT-A', 'name': 'Prateleira A - Entrada'},
        {'location_code': 'PRAT-B', 'name': 'Prateleira B - Processamento'},
        {'location_code': 'PRAT-C', 'name': 'Prateleira C - Saída'},
        {'location_code': 'ARMAZ-1', 'name': 'Armazém 1 - Matéria Prima'},
        {'location_code': 'ARMAZ-2', 'name': 'Armazém 2 - Produtos Acabados'}
    ]
    
    for loc_data in locations_data:
        Location.objects.get_or_create(
            branch=main_branch,
            location_code=loc_data['location_code'],
            defaults={'name': loc_data['name']}
        )
    
    # Create movement types - USANDO VALORES LITERAIS
    movement_types_data = [
        {
            'code': 'ENTRADA',
            'name': 'Entrada por Compra',
            'factor': 1,  # ADD = 1
            'category': 'IN',  # INBOUND
            'document_type': 'NF',  # INVOICE
            'requires_approval': False,
            'affects_finance': True,
            'description': 'Entrada de mercadorias por compra'
        },
        {
            'code': 'DEVENTRADA',
            'name': 'Devolução de Entrada',
            'factor': -1,  # SUBTRACT = -1
            'category': 'OUT',  # OUTBOUND
            'document_type': 'NF',  # INVOICE
            'requires_approval': True,
            'affects_finance': True,
            'description': 'Devolução de mercadorias recebidas'
        },
        {
            'code': 'SAIDA',
            'name': 'Saída por Venda',
            'factor': -1,  # SUBTRACT = -1
            'category': 'OUT',  # OUTBOUND
            'document_type': 'NF',  # INVOICE
            'requires_approval': False,
            'affects_finance': True,
            'description': 'Saída de mercadorias por venda'
        },
        {
            'code': 'DEVSAIDA',
            'name': 'Devolução de Saída',
            'factor': 1,  # ADD = 1
            'category': 'IN',  # INBOUND
            'document_type': 'NF',  # INVOICE
            'requires_approval': True,
            'affects_finance': True,
            'description': 'Devolução de mercadorias vendidas'
        },
        {
            'code': 'AJUSTE+',
            'name': 'Ajuste de Entrada',
            'factor': 1,  # ADD = 1
            'category': 'ADJ',  # ADJUSTMENT
            'document_type': 'INT',  # INTERNAL
            'requires_approval': True,
            'affects_finance': False,
            'description': 'Ajuste positivo de estoque'
        },
        {
            'code': 'AJUSTE-',
            'name': 'Ajuste de Saída',
            'factor': -1,  # SUBTRACT = -1
            'category': 'ADJ',  # ADJUSTMENT
            'document_type': 'INT',  # INTERNAL
            'requires_approval': True,
            'affects_finance': False,
            'description': 'Ajuste negativo de estoque'
        },
        {
            'code': 'TRANSF',
            'name': 'Transferência entre Locais',
            'factor': -1,  # SUBTRACT = -1 (para a origem)
            'category': 'TRF',  # TRANSFER
            'document_type': 'INT',  # INTERNAL
            'requires_approval': False,
            'affects_finance': False,
            'description': 'Transferência entre locais de estoque'
        }
    ]
    
    for mt_data in movement_types_data:
        MovementType.objects.get_or_create(
            code=mt_data['code'],
            defaults=mt_data
        )
    
    # Create category groups
    category_groups_data = [
        {'name': 'Matéria Prima', 'description': 'Materiais básicos para produção'},
        {'name': 'Componentes', 'description': 'Peças e componentes'},
        {'name': 'Produtos Acabados', 'description': 'Produtos finais para venda'},
        {'name': 'Embalagens', 'description': 'Materiais de embalagem'},
        {'name': 'Manutenção', 'description': 'Materiais para manutenção'}
    ]
    
    for cg_data in category_groups_data:
        CategoryGroup.objects.get_or_create(
            name=cg_data['name'],
            defaults={'description': cg_data['description']}
        )
    
    # Create default supplier
    Supplier.objects.get_or_create(
        name='Fornecedor Padrão',
        defaults={
            'country': 'BR',
            'tax_regime': 'REAL',  # Valor literal
            'contact_person': 'Contato Principal',
            'phone_number': '(11) 99999-9999',
            'email': 'contato@fornecedor.com'
        }
    )
    
    # Create system settings
    almoxarifado_sector = Sector.objects.filter(
        branch=main_branch, 
        name='Almoxarifado'
    ).first()
    
    if almoxarifado_sector:
        SystemSettings.objects.get_or_create(
            defaults={
                'default_branch': main_branch,
                'default_sector': almoxarifado_sector
            }
        )

def create_default_groups(apps, schema_editor):
    # Apenas cria os grupos básicos sem permissões específicas
    # As permissões podem ser configuradas manualmente no admin
    Group = apps.get_model('auth', 'Group')
    
    groups_data = [
        {'name': 'Almoxarife', 'description': 'Usuário com acesso completo ao módulo de estoque'},
        {'name': 'Operador de Estoque', 'description': 'Usuário com permissão para operações básicas'},
        {'name': 'Visualizador', 'description': 'Usuário com permissão apenas para visualização'}
    ]
    
    for group_data in groups_data:
        Group.objects.get_or_create(
            name=group_data['name'],
            defaults={}
        )

def reverse_initial_data(apps, schema_editor):
    # Esta é uma migration de dados, a reversão é opcional
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0001_initial'),
        # Removidas as dependências desnecessárias
    ]

    operations = [
        migrations.RunPython(create_initial_data, reverse_initial_data),
        migrations.RunPython(create_default_groups, reverse_initial_data),
    ]