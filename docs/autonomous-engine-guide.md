# UPLim Autonomous Engine - Complete Guide

## Overview

The UPLim Autonomous Engine is a revolutionary self-improving system that automatically evolves the UPLim programming language while maintaining strict adherence to its core ideology.

## Architecture

### Core Components

1. **Autonomous Engine** (`lib/autonomous-engine.ts`)
   - Main orchestrator of all evolution operations
   - Manages iteration loops and task processing
   - Coordinates between all subsystems

2. **API Routes** (`app/api/engine/route.ts`)
   - RESTful API for engine control
   - Real-time status monitoring
   - Action execution endpoints

3. **Web Dashboard** (`app/engine/page.tsx`)
   - Visual interface for monitoring
   - Real-time stats and metrics
   - Control panel for manual operations

## How It Works

### Iteration Cycle

Every iteration (10 seconds), the engine:

1. **Processes Tasks** - Handles queued improvements
2. **Analyzes Syntax** - Every 3 iterations
3. **Evolves Grammar** - Every 5 iterations
4. **Updates Docs** - Every 10 iterations

### Proposal Generation

The engine uses AI (via Ollama/OpenAI) to:
- Analyze current language state
- Identify improvement opportunities
- Generate structured proposals
- Validate against ideology

### Validation System

Every proposal is scored on:
- **Readability** (weight: 10) - Natural syntax, clarity
- **Safety** (weight: 10) - Memory-safe, no nulls
- **Portability** (weight: 9) - Cross-platform
- **Performance** (weight: 8) - Fast execution
- **Ergonomics** (weight: 9) - Developer experience

**Minimum Score:** 70% alignment required

### Test-Driven Development

All proposals must:
1. Include test cases
2. Pass all tests before implementation
3. Maintain backward compatibility (unless major version)
4. Auto-rollback on test failure

## API Reference

### GET `/api/engine`

Query parameters:
- `action=status` - Get current engine state
- `action=history` - Get evolution history
- `action=queue` - Get tasks queue

### POST `/api/engine`

Body:
```json
{
  "action": "start|stop|pause|resume|iterate"
}
```

## Web Dashboard

Access at `/engine`

**Features:**
- Real-time engine status
- Control buttons (start/stop/pause)
- Statistics dashboard
- Evolution history timeline
- Tasks queue viewer
- System logs

## Starting the Engine

```typescript
import { autonomousEngine } from '@/lib/autonomous-engine';

// Start autonomous evolution
await autonomousEngine.start();

// Pause for inspection
autonomousEngine.pause();

// Resume evolution
autonomousEngine.resume();

// Stop engine
autonomousEngine.stop();
```

## Safety Mechanisms

1. **Ideology Guard** - Rejects non-compliant proposals
2. **Test-First** - No implementation without tests
3. **Rollback** - Automatic revert on failures
4. **Manual Override** - Human can pause anytime
5. **Version Control** - Semantic versioning enforced

## Monitoring

### Key Metrics

- **Iteration Count** - Total evolution cycles
- **Proposal Rate** - Generated vs approved
- **Test Success** - Pass/fail ratio
- **Alignment Score** - Ideology compliance %

### Logs

Real-time logs show:
- Iteration progress
- Proposal generation
- Validation results
- Implementation status
- Test outcomes

## Configuration

Environment variables:
```bash
OLLAMA_MODEL=openai/gpt-4o-mini  # AI model for proposals
```

## Best Practices

1. **Monitor Regularly** - Check dashboard for anomalies
2. **Review Proposals** - Inspect rejected proposals
3. **Test Coverage** - Ensure comprehensive tests
4. **Backup State** - Save engine state periodically
5. **Version Control** - Track all changes in git

## Troubleshooting

### Engine Won't Start
- Check if already running
- Verify OLLAMA_MODEL is set
- Check console for errors

### Low Alignment Scores
- Review ideology definitions
- Adjust scoring weights
- Improve AI prompts

### Tests Failing
- Check test case validity
- Review implementation logic
- Verify compiler accuracy

## Future Enhancements

- Machine learning for better proposals
- Community voting system
- Automated benchmarking
- Security scanning
- Performance regression detection
- Multi-model proposal generation

## Contributing

The engine itself evolves! To contribute:
1. Fork the repository
2. Propose improvements
3. Submit via pull request
4. Engine will validate and integrate

---

**Remember:** The engine is designed to be fully autonomous but respects human oversight. Always monitor and review its decisions.
