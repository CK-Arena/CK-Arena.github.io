# CK-Arena Interactive Game Testing Guide

This document provides a comprehensive testing checklist for the newly implemented "Try It Yourself" interactive game feature.

## Prerequisites

1. Valid API keys for at least one of the following providers:
   - OpenAI (GPT-4o, GPT-4o-mini)
   - Anthropic (Claude 3.5 Sonnet, Claude 3 Haiku)
   - Google AI (Gemini 1.5 Pro, Gemini 1.5 Flash)

2. A modern web browser (Chrome, Firefox, Safari, Edge)

3. Internet connection for API calls

## Testing Checklist

### Phase 1: Navigation and UI

- [ ] Open index.html in a browser
- [ ] Verify the new navigation bar appears at the top with all links
- [ ] Click each navigation link and verify smooth scrolling to the correct section:
  - [ ] Home
  - [ ] Abstract
  - [ ] Game Demo
  - [ ] Try It Yourself
  - [ ] Knowledge Graph (opens in new tab)
  - [ ] Results
  - [ ] Citation
- [ ] Verify the "Try It Yourself" section is visible and properly styled

### Phase 2: API Configuration

- [ ] Navigate to "Try It Yourself" section
- [ ] Verify the API configuration panel is displayed
- [ ] Verify the security warning is prominently displayed
- [ ] Test OpenAI API configuration:
  - [ ] Enter an invalid API key and click "Test"
  - [ ] Verify error message appears
  - [ ] Enter a valid API key and click "Save"
  - [ ] Click "Test" and verify connection success message
  - [ ] Verify the key is saved (refresh page and check if it persists)
  - [ ] Click "Clear" and verify the key is removed
- [ ] Test Anthropic API configuration (same steps as OpenAI)
- [ ] Test Google AI API configuration (same steps as OpenAI)
- [ ] Verify "Continue to Game Setup" button is disabled when no valid API key exists
- [ ] Configure at least one valid API key and verify the button becomes enabled
- [ ] Click "Continue to Game Setup"

### Phase 3: Game Configuration

- [ ] Verify the game configuration panel appears
- [ ] Verify "Back to API Configuration" button works
- [ ] Test Category Selection:
  - [ ] Select each of the 11 categories and verify concept pairs load
  - [ ] Categories to test: Animals, Artifacts, Electronic Components, Food, Landforms, People Social, Plants, Sports, Stationery, Sundries, Tools
- [ ] Test Concept Pair Selection:
  - [ ] Verify the dropdown shows all available pairs for the selected category
  - [ ] Select different concept pairs and verify they are properly displayed
- [ ] Test Language Selection:
  - [ ] Switch between English and Chinese
  - [ ] Verify both options are available
- [ ] Test Player Count:
  - [ ] Use the slider to adjust player count from 4 to 8
  - [ ] Verify the number updates correctly
  - [ ] Verify the player model assignment list updates with the correct number of entries
- [ ] Test Undercover Count:
  - [ ] Adjust between 1 and 2 undercover agents
  - [ ] Verify the slider works correctly
- [ ] Test Model Assignment:
  - [ ] Verify that only models from configured API providers are available
  - [ ] Assign different models to different players
  - [ ] Verify the dropdown shows provider information (e.g., "GPT-4o (OpenAI)")
  - [ ] Test with multiple API providers configured
- [ ] Click "Start Game"

### Phase 4: Game Play

- [ ] Verify the game playing panel appears
- [ ] Verify player avatars are displayed (numbered circles)
- [ ] Monitor the game progress:
  - [ ] Verify "Game in Progress" header is displayed
  - [ ] Watch for player statements to appear
  - [ ] Verify statement display shows player ID and statement text
  - [ ] Verify player elimination notifications appear
  - [ ] Monitor for any error messages or console errors
- [ ] Game Event Monitoring:
  - [ ] Open browser console (F12) to check for any errors
  - [ ] Verify events are being logged (setup, statements, votes, eliminations)
  - [ ] Verify the game progresses through multiple rounds
- [ ] Wait for game completion (may take several minutes depending on player count and API response times)

### Phase 5: Game Results

- [ ] Verify the game results panel appears after game completion
- [ ] Check Winner Announcement:
  - [ ] Verify the winner is clearly displayed (Civilians Win / Undercover Wins / Draw)
  - [ ] Verify the winner banner has appropriate color (green for civilians, red for undercover, gray for draw)
  - [ ] Verify total rounds count is displayed
- [ ] Check Player Information:
  - [ ] Verify all players are listed with their IDs and models
  - [ ] Verify each player's role is displayed (civilian/undercover)
  - [ ] Verify eliminated players show their elimination round
  - [ ] Verify role colors are correct (green for civilian, red for undercover)
- [ ] Test Replay Functionality:
  - [ ] Click "Play Again" button
  - [ ] Verify it returns to the game configuration panel
  - [ ] Verify previous configuration is not saved (clean slate)
  - [ ] Configure and run another game to verify the system works multiple times

### Phase 6: Error Handling

- [ ] Test with Invalid API Key:
  - [ ] Modify localStorage to set an invalid key
  - [ ] Start a game and verify appropriate error handling
- [ ] Test with Network Issues:
  - [ ] Disconnect internet briefly during a game
  - [ ] Verify error messages are displayed
  - [ ] Verify the game handles network errors gracefully
- [ ] Test with Rate Limiting:
  - [ ] Run multiple games in quick succession
  - [ ] Verify rate limit errors are caught and handled
  - [ ] Verify retry mechanisms work (check console for retry messages)
- [ ] Test Invalid Responses:
  - [ ] Monitor console for any JSON parsing errors
  - [ ] Verify fallback behavior for invalid LLM responses

### Phase 7: Cross-Browser Testing

Test the entire flow in multiple browsers:
- [ ] Google Chrome
- [ ] Mozilla Firefox
- [ ] Safari (if on Mac)
- [ ] Microsoft Edge

### Phase 8: Responsive Design

- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (1024x768)
- [ ] Test on mobile (375x667)
- [ ] Verify all elements are properly sized and positioned
- [ ] Verify player avatars scale appropriately
- [ ] Verify buttons are easily clickable on touch screens

### Phase 9: Performance Testing

- [ ] Run a game with 4 players (minimum) and verify performance
- [ ] Run a game with 8 players (maximum) and verify performance
- [ ] Monitor memory usage in browser dev tools
- [ ] Verify the page remains responsive during game play
- [ ] Check for memory leaks after multiple games

### Phase 10: LocalStorage Persistence

- [ ] Configure API keys
- [ ] Refresh the page
- [ ] Verify API keys are still present
- [ ] Clear API keys
- [ ] Refresh the page
- [ ] Verify API keys are cleared

## Known Issues and Limitations

Document any issues found during testing:

1. CORS Issues with Anthropic API:
   - Anthropic API may not support direct browser access
   - Error message should guide users to use a proxy or backend server

2. API Rate Limits:
   - Users may hit rate limits with frequent testing
   - Retry mechanism should handle this automatically

3. Long Game Duration:
   - Games with many players may take several minutes
   - Consider adding a game speed control in future updates

## Success Criteria

- [ ] All navigation links work correctly
- [ ] At least one API provider can be configured and tested successfully
- [ ] A complete game can be run from start to finish without errors
- [ ] Game results are displayed correctly
- [ ] The system handles errors gracefully with clear user feedback
- [ ] The interface is responsive and works on different screen sizes
- [ ] API keys persist across page reloads
- [ ] Multiple games can be played in succession

## Reporting Issues

If you encounter any issues during testing, please report them with:

1. Browser and version
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Screenshots or console error messages
6. Network logs (if applicable)

## Next Steps

After successful testing, consider:

1. Adding game speed controls
2. Implementing game log export functionality
3. Adding more detailed statistics
4. Implementing game replay from saved logs
5. Adding custom prompt configuration
6. Supporting additional LLM providers
