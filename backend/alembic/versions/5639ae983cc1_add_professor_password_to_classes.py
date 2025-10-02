"""add_professor_password_to_classes

Revision ID: 5639ae983cc1
Revises: 13a7de3888ca
Create Date: 2025-10-02 12:28:50.764721

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5639ae983cc1'
down_revision: Union[str, None] = '13a7de3888ca'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add professor_password column to classes table
    op.add_column('classes', sa.Column('professor_password', sa.String(), nullable=True))

    # Set default password for existing class (American Government)
    op.execute("UPDATE classes SET professor_password = 'password' WHERE id = 1")

    # Make professor_password NOT NULL
    op.alter_column('classes', 'professor_password', nullable=False)


def downgrade() -> None:
    # Drop professor_password column
    op.drop_column('classes', 'professor_password')
