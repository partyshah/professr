"""add_classes_table_and_foreign_keys

Revision ID: 4a2b4c48c87a
Revises: 4a2f2060249e
Create Date: 2025-10-02 11:12:29.746914

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4a2b4c48c87a'
down_revision: Union[str, None] = '4a2f2060249e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create classes table
    op.create_table(
        'classes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('class_name', sa.String(), nullable=False),
        sa.Column('professor_name', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_classes_id'), 'classes', ['id'], unique=False)

    # Insert default class: American Government with Heather James
    op.execute("""
        INSERT INTO classes (id, class_name, professor_name)
        VALUES (1, 'American Government', 'Heather James')
    """)

    # Add class_id columns (nullable initially)
    op.add_column('students', sa.Column('class_id', sa.Integer(), nullable=True))
    op.add_column('assignments', sa.Column('class_id', sa.Integer(), nullable=True))
    op.add_column('sessions', sa.Column('class_id', sa.Integer(), nullable=True))

    # Backfill existing records with class_id = 1
    op.execute("UPDATE students SET class_id = 1")
    op.execute("UPDATE assignments SET class_id = 1")
    op.execute("UPDATE sessions SET class_id = 1")

    # Make class_id NOT NULL and add foreign key constraints
    op.alter_column('students', 'class_id', nullable=False)
    op.alter_column('assignments', 'class_id', nullable=False)
    op.alter_column('sessions', 'class_id', nullable=False)

    op.create_foreign_key('fk_students_class_id', 'students', 'classes', ['class_id'], ['id'])
    op.create_foreign_key('fk_assignments_class_id', 'assignments', 'classes', ['class_id'], ['id'])
    op.create_foreign_key('fk_sessions_class_id', 'sessions', 'classes', ['class_id'], ['id'])

    # Add indexes on class_id columns for better query performance
    op.create_index(op.f('ix_students_class_id'), 'students', ['class_id'], unique=False)
    op.create_index(op.f('ix_assignments_class_id'), 'assignments', ['class_id'], unique=False)
    op.create_index(op.f('ix_sessions_class_id'), 'sessions', ['class_id'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_sessions_class_id'), table_name='sessions')
    op.drop_index(op.f('ix_assignments_class_id'), table_name='assignments')
    op.drop_index(op.f('ix_students_class_id'), table_name='students')

    # Drop foreign keys
    op.drop_constraint('fk_sessions_class_id', 'sessions', type_='foreignkey')
    op.drop_constraint('fk_assignments_class_id', 'assignments', type_='foreignkey')
    op.drop_constraint('fk_students_class_id', 'students', type_='foreignkey')

    # Drop class_id columns
    op.drop_column('sessions', 'class_id')
    op.drop_column('assignments', 'class_id')
    op.drop_column('students', 'class_id')

    # Drop classes table
    op.drop_index(op.f('ix_classes_id'), table_name='classes')
    op.drop_table('classes')
