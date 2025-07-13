#!/bin/bash

# Extract RG_ID from userData.json
RG_ID=$(awk 'BEGIN { FS = """ } !/^[ \t]*[{}]/ { print $(NF - 1); exit }' modal-login/temp-data/userData.json)
CONFIG_PATH="hivemind_exp/configs/mac/grpo-qwen-2.5-0.5b-deepseek-r1.yaml"
IDENTITY_PATH="$PWD/swarm.pem"

# Run the training script with user input and supervisor recording
python -m hivemind_exp.gsm8k.train_single_gpu \
    --hf_token "None" \
    --identity_path "$IDENTITY_PATH" \
    --config "$CONFIG_PATH"

echo "Therapy session complete! Supervisor feedback has been recorded."
echo "You can find the feedback in: $(dirname $(dirname $(dirname $(python -c "import hivemind_exp.gsm8k.generate_prompts; print(hivemind_exp.gsm8k.generate_prompts.__file__)"))))/supervisor_content.txt" 