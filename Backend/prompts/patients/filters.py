
PATIENT_FILTER_TEMPLATE = """
## User Query
"{query}"

## Available Patients Data
{patient_data}

## Instructions
1. Parse the query to identify all filter criteria
2. Apply clinical definitions:
   - "High risk" = risk_level = "High"
   - "Rising BP" = systolic increasing >5 mmHg over 7 days OR diastolic increasing >3 mmHg
   - "Missed meals" = meals_missed_count >= 3 in past 7 days
   - "Weight gain projected" = weight_trend > 0.5 kg/week OR recent gain pattern
   - "Low adherence" = medication_adherence < 70% OR appointment_no_show

3. For each patient, determine if they match ALL criteria
4. Return matching patients in table format

## Clinical Thresholds Reference
| Criterion | Threshold |
|-----------|----------|
| High Blood Pressure | >130/80 mmHg |
| Rising BP | +5/+3 mmHg over 7 days |
| Elevated Glucose | Fasting >126 mg/dL or random >200 mg/dL |
| Weight Gain | >0.5 kg/week or >2 kg/month |
| Poor Adherence | <70% medication adherence |

## Output Format
Return a structured response with:
1. Interpreted filters (what you understood from the query)
2. Matching patients as a table with columns: ID, Name, Risk Level, Key Metrics, Status
3. Brief explanation

"""