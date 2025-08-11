from django.db import migrations

def create_default_movement_types(apps, schema_editor):
    """
    Cria os Tipos de Movimentação (TPOs) padrão no banco de dados.
    """
    # Usamos apps.get_model para obter o modelo na versão correta para esta migração
    MovementType = apps.get_model('inventory', 'MovementType')

    types_to_create = [
        {'name': 'Entrada (Compra de Fornecedor)', 'factor': 1, 'units_per_package': None},
        {'name': 'Saída (Venda)', 'factor': -1, 'units_per_package': None},
        {'name': 'Uso Interno', 'factor': -1, 'units_per_package': None},
        {'name': 'Ajuste de Inventário (Entrada)', 'factor': 1, 'units_per_package': None},
        {'name': 'Ajuste de Inventário (Saída)', 'factor': -1, 'units_per_package': None},
        {'name': 'Receber Caixa Fechada', 'factor': 1, 'units_per_package': 25}, # Exemplo com multiplicador
    ]

    for type_data in types_to_create:
        MovementType.objects.create(**type_data)


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_movement_types),
    ]