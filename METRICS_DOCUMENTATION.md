# Metrics Documentation

This document defines the custom metrics referenced throughout the FACILITAIR blog posts and research documentation.

## Table of Contents

1. [Pass Rate](#pass-rate)
2. [Confidence Score](#confidence-score)
3. [Quality Improvement](#quality-improvement)
4. [Word Error Rate (WER)](#word-error-rate-wer)
5. [Detection Rate](#detection-rate)
6. [Average Confidence](#average-confidence)
7. [Cost Per Task](#cost-per-task)
8. [Total Cost of Ownership (TCO)](#total-cost-of-ownership-tco)

---

## Pass Rate

**Definition**: The percentage of tasks that meet or exceed a minimum quality threshold.

**Measurement**:
- Tasks are evaluated against a predefined quality rubric (typically 6-dimensional: correctness, completeness, efficiency, readability, maintainability, documentation)
- Pass threshold: Score ≥ 0.70 on the quality rubric (scale 0.00-1.00)
- Formula: `Pass Rate = (Tasks Passing / Total Tasks) × 100%`

**Example**: In a benchmark of 100 code generation tasks, if 73 tasks score ≥ 0.70, the pass rate is 73%.

**Used In**: Code generation benchmarks, multi-agent collaboration research

---

## Confidence Score

**Definition**: A normalized score (0.0-1.0) representing the model's certainty in its output or prediction.

**Measurement**:
- For classification tasks: Softmax probability of the predicted class
- For detection tasks: Model's internal confidence estimate
- For generation tasks: Aggregate of token-level probabilities

**Interpretation**:
- 0.0-0.5: Low confidence
- 0.5-0.8: Medium confidence
- 0.8-1.0: High confidence

**Example**: An anomaly detection agent reports 0.87 confidence that a spike in API latency is an anomaly.

**Used In**: Anomaly detection, multi-agent consensus, quality scoring

---

## Quality Improvement

**Definition**: The relative increase in quality score compared to a baseline approach.

**Measurement**:
- Formula: `Quality Improvement = ((New Score - Baseline Score) / Baseline Score) × 100%`
- Baseline: Single-model, single-shot code generation (typically GPT-4 or Claude)
- New Score: Multi-agent or orchestrated approach

**Example**:
- Baseline quality: 0.531
- Sequential multi-agent quality: 0.726
- Quality improvement: ((0.726 - 0.531) / 0.531) × 100% = 36.7%

**Used In**: Multi-agent collaboration benchmarks, orchestration research

---

## Word Error Rate (WER)

**Definition**: The percentage of words that are incorrect in a transcription compared to the reference text.

**Measurement**:
- Formula: `WER = (Substitutions + Insertions + Deletions) / Total Reference Words × 100%`
- Calculated using Levenshtein distance at word level
- Lower is better (0% = perfect transcription)

**Example**:
- Reference: "the quick brown fox"
- Hypothesis: "the quick brown cat"
- WER: 1 substitution / 4 words = 25%

**Baseline**: OpenAI Whisper-Small achieves 4.9% WER on LibriSpeech test-clean

**Used In**: Dendritic neural network compression research (Whisper-Small)

---

## Detection Rate

**Definition**: The percentage of true anomalies correctly identified by the detection system.

**Measurement**:
- Formula: `Detection Rate = (True Positives / (True Positives + False Negatives)) × 100%`
- Also known as "Recall" or "Sensitivity"
- Requires labeled ground truth data

**Example**:
- 15 true anomalies in test set
- System detects 15 (0 false negatives)
- Detection Rate: 15/15 × 100% = 100%

**Used In**: Anomaly Hunter multi-agent detection system

---

## Average Confidence

**Definition**: Mean confidence score across all detections made by the system.

**Measurement**:
- Formula: `Avg Confidence = Σ(Confidence Scores) / Number of Detections`
- Scale: 0.0-1.0 (or 0-100%)
- Higher is better (indicates system certainty)

**Example**:
- 15 detections with confidences: 0.87, 0.92, 0.85, ... (mean = 0.78)
- Average Confidence: 78% or 0.78

**Context**: High average confidence (>75%) combined with high detection rate indicates a reliable system.

**Used In**: Anomaly Hunter performance validation

---

## Cost Per Task

**Definition**: The total API token cost required to complete a single task.

**Measurement**:
- Formula: `Cost/Task = (Input Tokens × Input Price + Output Tokens × Output Price)`
- Measured in USD per task
- Includes all API calls (planning, generation, validation, synthesis)

**Example**:
- Sequential multi-agent approach: $0.195 per task
- Baseline single-model: $0.025 per task

**Trade-off**: Higher cost per task may be justified by higher quality (ROI analysis required)

**Used In**: AI code generation research, orchestration cost analysis

---

## Total Cost of Ownership (TCO)

**Definition**: The total cost to process a fixed number of tasks (typically 1,000).

**Measurement**:
- Formula: `TCO = Cost/Task × Number of Tasks`
- Typically reported for 1K tasks or 10K tasks
- Used for comparing different approaches at scale

**Example**:
- Sequential approach: $0.195/task × 1,000 = $195 TCO (1K tasks)
- Baseline approach: $0.025/task × 1,000 = $25 TCO (1K tasks)

**Context**: Must consider quality improvements when evaluating TCO differences.

**ROI Example**:
- 37% quality improvement for 7.8× cost increase
- Reduced debugging time may offset higher API costs

**Used In**: Enterprise AI cost modeling, orchestration research

---

## Additional Context

### Quality Rubric (6-Dimensional)

Tasks are evaluated across 6 dimensions on a 0.00-1.00 scale:

1. **Correctness**: Does the code produce correct output?
2. **Completeness**: Are all requirements implemented?
3. **Efficiency**: Is the code reasonably performant?
4. **Readability**: Is the code clear and well-structured?
5. **Maintainability**: Is the code modular and extensible?
6. **Documentation**: Are comments and docstrings present?

**Final Quality Score**: Mean of all 6 dimensions

**Pass Threshold**: ≥0.70 (70%)

### Statistical Significance

When comparing approaches:
- Sample size: Typically 100 tasks
- Confidence level: 95%
- Statistical test: Two-tailed t-test
- Reported: Mean ± standard deviation

---

## Updates & Changelog

**October 27, 2025**: Initial version published alongside first blog post

---

For questions about these metrics or their application in specific research contexts, contact: blake@facilitair.ai
