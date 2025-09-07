"""Add PDF fields to assignments table

Revision ID: add_pdf_fields
Revises: bfd976443260
Create Date: 2025-09-07 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'add_pdf_fields'
down_revision = 'bfd976443260'
branch_labels = None
depends_on = None


def upgrade():
    # Add columns for PDF paths as JSON arrays
    op.add_column('assignments', sa.Column('pdf_paths', sa.JSON(), nullable=True))
    op.add_column('assignments', sa.Column('solution_pdf_paths', sa.JSON(), nullable=True))
    op.add_column('assignments', sa.Column('week_number', sa.Integer(), nullable=True))


def downgrade():
    # Remove the columns
    op.drop_column('assignments', 'week_number')
    op.drop_column('assignments', 'solution_pdf_paths')
    op.drop_column('assignments', 'pdf_paths')