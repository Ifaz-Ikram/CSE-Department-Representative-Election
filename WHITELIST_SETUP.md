# Voter Whitelist Setup

## Overview
The CSE23 Department Representative Election system now has a voter whitelist system that restricts access to exactly 200 pre-registered students from the CSE23 batch.

## Database Structure
- **VoterRegistry Table**: Contains the whitelist of 200 authorized voters
  - `regNo`: Student registration number (unique)
  - `email`: Student email address (unique)
  - `firstName`: Student first name (normalized)
  - `lastName`: Student last name (normalized)
  - `indexNumber`: Student index number
  - `isActive`: Boolean flag to enable/disable voter access

## Name Normalization
All student names are automatically normalized using the following rules:
- Convert entire name to lowercase
- Capitalize only the first letter
- Example: "JOHN" → "John", "daksitha" → "Daksitha"

## Authentication Flow
1. User attempts to sign in with Google OAuth
2. System checks if the email exists in `VoterRegistry`
3. If not found or `isActive = false`, access is denied with error message
4. If found and active:
   - User record is created/updated in `User` table
   - First and last names are normalized from registry
   - Role is assigned:
     - **super_admin**: `ifazi.23@cse.mrt.ac.lk` (Registration: 230253H)
     - **voter**: All other whitelisted students
5. User is redirected to appropriate dashboard

## Special Cases

### Super Admin
- Email: `ifazi.23@cse.mrt.ac.lk`
- RegNo: `230253H`
- Role: `super_admin` (preserved on subsequent logins)
- Has full administrative access

### Role Preservation
- Once a user's role is set in the `User` table, it will NOT be overwritten
- This allows admins to promote voters to admin role without it being reset

## Seeded Data
- **Total Students**: 190 (from CSE23 batch)
- **Seed Command**: `npx prisma db seed`
- **Seed File**: `prisma/seed.ts`

## Access Control
- ✅ Only emails in `VoterRegistry` can sign in
- ✅ Inactive voters (`isActive = false`) are blocked
- ✅ Non-CSE emails show error notification
- ✅ Names are automatically normalized on first login

## Adding/Removing Voters

### To Add a New Voter
```ts
await prisma.voterRegistry.create({
  data: {
    regNo: "230XXX",
    email: "student.23@cse.mrt.ac.lk",
    firstName: "Student",
    lastName: "Name",
    indexNumber: "230XXX",
    isActive: true
  }
});
```

### To Disable a Voter
```ts
await prisma.voterRegistry.update({
  where: { email: "student.23@cse.mrt.ac.lk" },
  data: { isActive: false }
});
```

### To Promote a Voter to Admin
```ts
await prisma.user.update({
  where: { email: "student.23@cse.mrt.ac.lk" },
  data: { role: "admin" }
});
```

## Security Features
1. **Whitelist Enforcement**: Only pre-registered emails can access the system
2. **Domain Validation**: All emails must be `@cse.mrt.ac.lk`
3. **Active Status Check**: Voters can be deactivated without deleting records
4. **Role Protection**: Roles are preserved after initial assignment
5. **Error Notifications**: Users see clear error messages on access denial

## Testing Checklist
- [ ] Try logging in with a whitelisted email
- [ ] Try logging in with a non-CSE email
- [ ] Try logging in with an inactive voter account
- [ ] Verify super_admin access for `ifazi.23@cse.mrt.ac.lk`
- [ ] Verify name normalization works correctly
- [ ] Check that voter role is assigned to new whitelisted users
- [ ] Verify role is preserved on subsequent logins

## Notes
- CSV files are excluded from git via `.gitignore`
- Migration: `20251204194922_add_voter_registry`
- Total voters seeded: 190
