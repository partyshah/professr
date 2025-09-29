"""add_reading_text_to_assignments

Revision ID: 4a2f2060249e
Revises: add_pdf_fields
Create Date: 2025-09-29 05:51:37.929236

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4a2f2060249e'
down_revision: Union[str, None] = 'add_pdf_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if column already exists before adding it
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('assignments')]

    if 'reading_text' not in columns:
        op.add_column('assignments', sa.Column('reading_text', sa.Text(), nullable=True))
        print("Added reading_text column to assignments table")
    else:
        print("reading_text column already exists, skipping...")


def downgrade() -> None:
    # Check if column exists before dropping it
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('assignments')]

    if 'reading_text' in columns:
        op.drop_column('assignments', 'reading_text')
        print("Dropped reading_text column from assignments table")
    else:
        print("reading_text column does not exist, skipping...")
