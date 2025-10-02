"""add_prompts_to_classes

Revision ID: 13a7de3888ca
Revises: 22c6a9d4c14a
Create Date: 2025-10-02 12:09:42.991319

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '13a7de3888ca'
down_revision: Union[str, None] = '22c6a9d4c14a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add tutor_prompt and evaluation_prompt columns
    op.add_column('classes', sa.Column('tutor_prompt', sa.Text(), nullable=True))
    op.add_column('classes', sa.Column('evaluation_prompt', sa.Text(), nullable=True))

    # Import default prompts to backfill existing class
    from prompts import TUTOR_SYSTEM_PROMPT, EVALUATION_SYSTEM_PROMPT

    # Update existing class with default prompts
    # Using bound parameters to safely handle large text values
    op.execute(
        sa.text("""
            UPDATE classes
            SET tutor_prompt = :tutor_prompt,
                evaluation_prompt = :eval_prompt
            WHERE id = 1
        """).bindparams(
            tutor_prompt=TUTOR_SYSTEM_PROMPT,
            eval_prompt=EVALUATION_SYSTEM_PROMPT
        )
    )


def downgrade() -> None:
    # Drop the prompt columns
    op.drop_column('classes', 'evaluation_prompt')
    op.drop_column('classes', 'tutor_prompt')
