"""add user_id to tags

Revision ID: 2bc574360dd1
Revises: 1bc473259cc0
Create Date: 2026-02-24

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "2bc574360dd1"
down_revision: Union[str, None] = "1bc473259cc0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add user_id column (nullable first for existing rows)
    op.add_column("tags", sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True))

    # Backfill: set user_id from the entry owner for existing tags
    op.execute(
        """
        UPDATE tags
        SET user_id = sub.user_id
        FROM (
            SELECT DISTINCT ON (et.tag_id) et.tag_id, e.user_id
            FROM entry_tags et
            JOIN entries e ON e.id = et.entry_id
        ) sub
        WHERE tags.id = sub.tag_id
        """
    )

    # Delete orphan tags that have no entries (and thus no user_id)
    op.execute("DELETE FROM tags WHERE user_id IS NULL")

    # Make column non-nullable now that all rows have a value
    op.alter_column("tags", "user_id", nullable=False)

    # Add FK constraint
    op.create_foreign_key(
        "fk_tags_user_id", "tags", "users", ["user_id"], ["id"], ondelete="CASCADE"
    )

    # Drop old unique index on name only (created as an index, not a named constraint)
    op.drop_index("ix_tags_name", table_name="tags")

    # Add new composite unique constraint
    op.create_unique_constraint("uq_tag_name_user", "tags", ["name", "user_id"])


def downgrade() -> None:
    op.drop_constraint("uq_tag_name_user", "tags", type_="unique")
    op.create_index(op.f("ix_tags_name"), "tags", ["name"], unique=True)
    op.drop_constraint("fk_tags_user_id", "tags", type_="foreignkey")
    op.drop_column("tags", "user_id")
