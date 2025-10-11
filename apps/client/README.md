# Welcome to your Lovable project

## Dexie Migration & Sync Manager

This application uses Dexie (IndexedDB) for persistent storage with a robust sync manager for server synchronization.

### Migration from localStorage

The app automatically migrates from localStorage to Dexie on first load. The migration:

1. Reads existing notes from `vcw:enhancedNotes` localStorage key
2. Converts to Dexie NoteRecord format
3. Stores in IndexedDB with backup in meta table
4. Sets migration flag to prevent re-migration

### Rollback (if needed)

To rollback to localStorage (for debugging):

```javascript
// In browser console
import { rollbackFromDexieToLocalStorage } from './src/utils/migration/localStorageToDexie';
rollbackFromDexieToLocalStorage().then(result => console.log(result));
```

### Sync Manager

The sync manager batches local changes and sends them to `/api/sync/events`. Features:

- **Batching**: Collects events for 2s after last change, or when 20+ events, or every 60s
- **Retry**: Progressive backoff on failures (1s, 2s, 5s, 10s, 30s)
- **Conflict Resolution**: UI for handling server conflicts
- **Offline Support**: Queues events when offline, syncs on reconnection
- **Leader Election**: Only one tab syncs to prevent duplicates

### Feature Flag

Set `DEXIE_PERSISTENCE_ENABLED = false` in `src/utils/migration/localStorageToDexie.ts` to disable Dexie and use localStorage only.

### Debug Tools

- **Sync Status Badge**: Shows current sync status in top-right
- **Debug Panel**: Available in development mode with sync details
- **Console Logs**: Check browser console for detailed sync logs
- **Force Sync**: Click debug panel button to trigger immediate sync

### API Contract

The sync manager expects `/api/sync/events` endpoint with this contract:

**Request:**
```json
{
  "clientId": "device-uuid",
  "events": [
    {
      "id": "event-uuid",
      "type": "note.create|note.update|note.delete",
      "resourceId": "note-id",
      "payload": { /* event data */ },
      "createdAt": "ISO-string",
      "opSeq": 123
    }
  ]
}
```

**Success Response:**
```json
{
  "applied": ["event-uuid"],
  "updatedResources": [
    {
      "resourceType": "note",
      "id": "note-id",
      "content": { /* canonical content */ },
      "version": 2,
      "updatedAt": "ISO-string"
    }
  ],
  "conflicts": [
    {
      "resourceId": "note-id",
      "serverState": { /* server version */ },
      "clientEventIds": ["event-uuid"],
      "reason": "concurrent_update"
    }
  ]
}
```

## Project info

**URL**: https://lovable.dev/projects/a42424d3-3564-4d6c-93b1-d240441aef84

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a42424d3-3564-4d6c-93b1-d240441aef84) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a42424d3-3564-4d6c-93b1-d240441aef84) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
