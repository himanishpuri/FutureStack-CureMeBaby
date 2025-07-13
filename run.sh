#!/bin/bash

# Activate conda environment
source $(conda info --base)/etc/profile.d/conda.sh
conda activate rl-swarm

# Change directory to rl-swarm
cd rl-swarm

# Set variables
RG_ID=$(awk 'BEGIN { FS = "\"" } !/^[ \t]*[{}]/ { print $(NF - 1); exit }' modal-login/temp-data/userData.json)
CONFIG_PATH="hivemind_exp/configs/mac/grpo-qwen-2.5-0.5b-deepseek-r1.yaml"
IDENTITY_PATH="$PWD/swarm.pem"

# Run Python command - using get_user_input_samples function to read from chat.json
python -m hivemind_exp.gsm8k.train_single_gpu \
    --hf_token "None" \
    --identity_path "$IDENTITY_PATH" \
    --config "$CONFIG_PATH" \
    --use_chat_json "True" 