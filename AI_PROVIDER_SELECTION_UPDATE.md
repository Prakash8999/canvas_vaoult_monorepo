# AI Provider & Model Selection - Update Summary

## Changes Made

### Added Provider and Model Selection to AiDrawer

The AiDrawer component now includes dropdown selectors for choosing between different AI providers and their respective models.

## What Was Added

### 1. **State Management**
```typescript
const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'perplexity'>('gemini');
const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash-exp');
```

### 2. **Auto-Update Model on Provider Change**
When the user switches providers, the model automatically updates to the first available model for that provider:

```typescript
useEffect(() => {
  if (constraints?.supportedModels) {
    const models = constraints.supportedModels[selectedProvider];
    if (models && models.length > 0) {
      setSelectedModel(models[0]);
    }
  }
}, [selectedProvider, constraints]);
```

### 3. **UI Components**
Added a new "AI Configuration" section in the header with:
- **Provider Dropdown**: Select between Gemini and Perplexity
- **Model Dropdown**: Select from available models for the chosen provider

The UI is styled to match the existing design with:
- Small, compact dropdowns (h-8, text-xs)
- Workspace-themed colors
- Settings icon for visual clarity
- Grid layout for side-by-side selection

### 4. **Dynamic Model Options**
The model dropdown automatically updates based on the selected provider:
- **Gemini**: Shows `gemini-2.0-flash-exp`, `gemini-exp-1206`
- **Perplexity**: Shows `sonar`, `sonar-pro`

### 5. **Updated API Call**
The `handleSendMessage` function now uses the selected provider and model:

```typescript
const response = await generateAI.mutateAsync({
  provider: selectedProvider,  // Dynamic
  model: selectedModel,         // Dynamic
  input: messageContent,
});
```

## User Experience

### Before
- Users could only use Gemini with a hardcoded model
- No way to switch providers or models

### After
- Users can choose between Gemini and Perplexity
- Users can select different models for each provider
- Model selection automatically updates when provider changes
- Clean, intuitive UI that fits the existing design

## Visual Layout

```
┌─────────────────────────────────────┐
│ AI Assistant                    [X] │
│ Working on: Note Title              │
├─────────────────────────────────────┤
│ 🪙 AI Credits              [10]     │
├─────────────────────────────────────┤
│ ⚙️  AI Configuration                │
│ ┌────────────┬──────────────────┐   │
│ │ Provider   │ Model            │   │
│ │ [Gemini ▼] │ [gemini-2.0... ▼]│   │
│ └────────────┴──────────────────┘   │
└─────────────────────────────────────┘
```

## Technical Details

### Imports Added
```typescript
import { Settings2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
```

### Props Used
- `constraints?.supportedProviders` - List of available providers
- `constraints?.supportedModels[provider]` - List of models per provider

## Testing

To test the new feature:

1. Open the AI Drawer
2. Look for "AI Configuration" section below credits
3. Click the Provider dropdown
4. Select "Perplexity"
5. Notice the Model dropdown automatically updates to show Perplexity models
6. Select a model (e.g., "sonar")
7. Send a message
8. Verify the request uses the selected provider and model

## Benefits

1. **Flexibility**: Users can choose the best AI provider for their needs
2. **User Control**: Full control over which model to use
3. **Smart Defaults**: Automatically selects appropriate models
4. **Clean UX**: Integrated seamlessly into existing design
5. **Type Safety**: Full TypeScript support with proper types

## Future Enhancements

Potential improvements for future versions:
- Remember user's last selected provider/model (localStorage)
- Show model descriptions/capabilities
- Display model-specific features (e.g., "Online search" for Perplexity)
- Add tooltips explaining each provider's strengths
- Show estimated response time per model

## Files Modified

- `apps/client/src/components/ai/AiDrawer.tsx`
  - Added provider/model state
  - Added auto-update effect
  - Added UI components
  - Updated API call logic

## No Breaking Changes

This update is fully backward compatible and doesn't affect:
- Backend API
- Existing AI functionality
- Credit system
- Error handling
- Other components

---

**Status**: ✅ Complete and ready to use!
