"""add_access_code_to_classes

Revision ID: 22c6a9d4c14a
Revises: 4a2b4c48c87a
Create Date: 2025-10-02 11:35:17.602794

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '22c6a9d4c14a'
down_revision: Union[str, None] = '4a2b4c48c87a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add access_code column to classes table
    op.add_column('classes', sa.Column('access_code', sa.String(length=6), nullable=True))

    # Update existing class with access code
    op.execute("UPDATE classes SET access_code = 'AMG001' WHERE id = 1")

    # Make access_code NOT NULL and unique
    op.alter_column('classes', 'access_code', nullable=False)
    op.create_unique_constraint('uq_classes_access_code', 'classes', ['access_code'])
    op.create_index(op.f('ix_classes_access_code'), 'classes', ['access_code'], unique=True)


def downgrade() -> None:
    # Drop index and constraint
    op.drop_index(op.f('ix_classes_access_code'), table_name='classes')
    op.drop_constraint('uq_classes_access_code', 'classes', type_='unique')

    # Drop access_code column
    op.drop_column('classes', 'access_code')
