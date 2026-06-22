# Storage and deletion

## SQLite

Runtime records are stored in SQLite through Prisma.

The database location is selected by `DATABASE_URL`. The tracked example uses:

```dotenv
DATABASE_URL="file:./dev.db"
```

Database files are ignored by Git.

## Seed JSON

Files in `prisma/seed/*.json` are deterministic seed inputs.

They are not runtime persistence and must not be described as the application's data store.

`server/services/jsonFileStore.ts` remains as a tested utility, but production API routes do not use it for runtime domain persistence.

## Company logos

Company logos are stored under:

```text
uploads/company-logos/<companyId>/<logoId>.<extension>
```

Supported upload types:

- JPEG;
- PNG;
- WebP.

Maximum size: 5 MB.

Validation covers:

- non-empty body;
- safe filename;
- supported MIME type;
- matching filename extension;
- matching magic bytes;
- path containment.

### Replacement workflow

A replacement file is copied to a staged path and renamed to its target path. The previous file is then removed before `Company.logoUrl` is updated in SQLite.

This is not one atomic transaction.

Important limitations:

- if the database update fails after staging succeeds, the new file may remain without a matching database reference;
- the previous logo may already have been removed;
- manual cleanup may be required after a partial failure.

### Logo deletion workflow

The delete route attempts to remove the file first, then clears `Company.logoUrl`.

If filesystem deletion fails, the route logs a warning and still clears the database field.

If the database update fails after filesystem deletion, the database may temporarily reference a missing file.

## Evidence

Evidence records, relationships, metadata, and HTTP exchanges are stored in SQLite.

Potential evidence files are constrained to:

```text
uploads/evidence/
```

The current API does not accept multipart Evidence uploads.

The static evidence router can serve supported files that already exist inside the evidence root. It rejects directory requests, traversal attempts, and unsupported extensions.

Supported static extensions:

- `.gif`
- `.jpeg`
- `.jpg`
- `.json`
- `.pdf`
- `.png`
- `.txt`
- `.webp`

JSON evidence is served as an attachment.

Evidence deletion currently removes database records through the repository. It does not coordinate deletion of a physical evidence file.

## Report snapshots

`ReportVersion.snapshot` is stored as validated JSON in SQLite.

A snapshot contains report title, Company and Assessment names, branding, and selected Threat content.

The ReportVersion repository has no update or delete methods, which makes saved versions immutable at that boundary.

`ReportVersion.filePath` is optional metadata. The repository does not create, delete, or roll back a physical report file.

## Database transactions versus files

Prisma transactions protect database writes only.

They cannot roll back:

- copied or renamed files;
- deleted files;
- static files created outside the repository;
- report files referenced only by a path.

Do not claim complete rollback across SQLite and the filesystem unless a workflow explicitly stages files and includes compensating cleanup.

## Local backup

For local development, back up both:

- the SQLite database selected by `DATABASE_URL`;
- relevant directories under `uploads/`.

Backing up only one side can leave broken file references.
