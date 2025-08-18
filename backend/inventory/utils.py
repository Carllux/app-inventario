# backend/inventory/utils.py

from PIL import Image as PilImage
from io import BytesIO
from django.core.files.base import ContentFile
import os

def optimize_image(image_field):
    """Redimensiona e converte uma imagem para WebP."""
    pil_image = PilImage.open(image_field)

    max_width, max_height = 1024, 1024
    if pil_image.width > max_width or pil_image.height > max_height:
        pil_image.thumbnail((max_width, max_height))

    buffer = BytesIO()
    pil_image.save(buffer, format='WEBP', quality=85)
    buffer.seek(0)

    file_name, _ = os.path.splitext(image_field.name)
    new_file_name = f"{file_name}.webp"
    
    # Retorna o nome e o conteúdo para serem salvos
    return new_file_name, ContentFile(buffer.read())