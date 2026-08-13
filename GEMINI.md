# GitHub Auto-Save Rule

- When you (the agent) complete a programming task, implement a feature, or finish modifying files for the user in this project, you MUST automatically commit and push the changes to GitHub before ending your turn.
- Run `git add .`, `git commit -m "[Brief summary of changes]"`, `git push origin main`, and `git push -f origin main:gh-pages` to save the work and deploy the site.
- Do not wait for the user to explicitly ask you to push; do it automatically as the final step of your task execution.
