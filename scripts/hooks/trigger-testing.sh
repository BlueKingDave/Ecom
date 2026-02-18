# scripts/hooks/trigger-testing.sh
#!/bin/bash

BRANCH=$(git branch --show-current)
TASK_ID=$(echo $BRANCH | grep -oP '(?<=-)T\d+')

if [ -z "$TASK_ID" ]; then
  echo "No task ID found in branch name"
  exit 0
fi

# Update state
python scripts/utils/task-manager.py set-status $TASK_ID "needs-tests"

# Trigger testing agent
echo "Triggering testing agent for $TASK_ID..."
claude-code --agent=testing --task=$TASK_ID