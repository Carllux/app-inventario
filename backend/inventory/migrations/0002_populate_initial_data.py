# backend/inventory/migrations/0002_populate_initial_data.py

from django.db import migrations

def populate_data(apps, schema_editor):
    """
    Cria os dados iniciais essenciais para o sistema:
    - 1 Filial Padrão
    - 3 Setores Padrão (associados à filial)
    - 1 Local Padrão de Recebimento (associado à filial)
    - 5 Tipos de Movimentação (TPOs)
    - 1 Categoria e 1 Fornecedor Padrão
    """
    # Usamos apps.get_model para obter a versão correta dos modelos para esta migração
    Branch = apps.get_model('inventory', 'Branch')
    Sector = apps.get_model('inventory', 'Sector')
    Location = apps.get_model('inventory', 'Location')
    MovementType = apps.get_model('inventory', 'MovementType')
    Category = apps.get_model('inventory', 'Category')
    Supplier = apps.get_model('inventory', 'Supplier')

    # --- 1. Criar a Filial Principal (dependência para outros) ---
    main_branch, created = Branch.objects.get_or_create(
        name='Filial Principal'
    )

    # --- 2. Criar Setores Padrão (associados à Filial Principal) ---
    sectors_data = ['Administrativo', 'Estoque', 'Vendas']
    for sector_name in sectors_data:
        Sector.objects.get_or_create(branch=main_branch, name=sector_name)

    # --- 3. Criar Local Padrão (associado à Filial Principal) ---
    Location.objects.get_or_create(
        branch=main_branch,
        location_code='REC-01',
        name='Área de Recebimento'
    )

    # --- 4. Criar Tipos de Movimentação (TPOs) Padrão ---
    movement_types_data = [
        {'name': 'Entrada (Compra de Fornecedor)', 'factor': 1},
        {'name': 'Saída (Venda)', 'factor': -1},
        {'name': 'Uso Interno', 'factor': -1},
        {'name': 'Ajuste de Inventário (Entrada)', 'factor': 1},
        {'name': 'Ajuste de Inventário (Saída)', 'factor': -1},
    ]
    for mt_data in movement_types_data:
        MovementType.objects.get_or_create(**mt_data)

    # --- 5. Criar Categoria e Fornecedor Padrão ---
    Category.objects.get_or_create(name='Não Categorizado')
    Supplier.objects.get_or_create(name='Avulso / Não Identificado', country='BR')


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(populate_data),
    ]