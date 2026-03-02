# Database Migration Scripts

This directory contains migration scripts to migrate from the old profile-based system to the new RBAC (Role-Based Access Control) system.

## Migration Order

Run these scripts in the following order:

### 1. Migrate Profile Pages to Role Pages

Migrates data from `profile_pages` table to `role_pages` table and drops the old table.

```bash
npx ts-node src/scripts/migrate-profile-pages-to-role-pages.ts
```

**What it does:**
- Finds all roles by their code (admin, finance, student, etc.)
- Migrates all `profile_pages` entries to `role_pages` using the corresponding `role_id`
- Drops the `profile_pages` table

### 2. Migrate User Profiles to User Roles

Migrates user profiles to user_roles and optionally removes the profile column.

```bash
npx ts-node src/scripts/migrate-user-profiles-to-roles.ts
```

**What it does:**
- Finds all users with a `profile` column value
- Creates corresponding entries in `user_roles` table
- Optionally removes the `profile` column from `users` table (commented out for safety)

**Note:** The profile column removal is commented out by default. After verifying the migration:
1. Check the `user_roles` table to ensure all users have been migrated
2. Uncomment the profile column removal code in the script
3. Run the script again to remove the column

## Prerequisites

- Node.js and npm installed
- Database connection configured in `.env` file:
  - `DB_HOST`
  - `DB_PORT`
  - `DB_USERNAME`
  - `DB_PASSWORD`
  - `DB_NAME`

## Safety Notes

- **Backup your database** before running these migrations
- The scripts check for existing data to avoid duplicates
- The `profile_pages` table is dropped automatically after migration
- The `profile` column removal is optional and must be explicitly enabled

## Verification

After running migrations, verify:

1. **role_pages table:**
   ```sql
   SELECT COUNT(*) FROM role_pages;
   ```

2. **user_roles table:**
   ```sql
   SELECT COUNT(*) FROM user_roles;
   ```

3. **Check for orphaned data:**
   ```sql
   -- Should return 0 if all users were migrated
   SELECT COUNT(*) FROM users WHERE profile IS NOT NULL;
   ```

## Troubleshooting

If you encounter errors:

1. Check that system roles are seeded (run the application once to trigger the seeder)
2. Verify database connection settings
3. Check that all profile values match existing role codes
4. Review the error messages in the console output
