export const getWelcomeContent = () => ({
    blocks: [
      {
        type: 'paragraph',
        data: {
          text: 'Welcome to your enhanced note editor! Here are some features to get you started:'
        }
      },
      {
        type: 'list',
        data: {
          style: 'unordered',
          items: [
            'Create links between notes using [[Note Name]] syntax',
            'Add tags to organize your notes with #hashtag',
            'Use the graph view to visualize connections',
            'Run JavaScript and Python code in runnable blocks',
            'Create charts from your data',
            'Pin important notes for quick access'
          ]
        }
      },
      {
        type: 'paragraph',
        data: {
          text: 'Try creating a link to a new note: [[My First Note]] - click it to create and navigate!'
        }
      }
    ]
  });