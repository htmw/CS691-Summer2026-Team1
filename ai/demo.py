"""
IAPO — extraction demo.

Runs a few sample student messages through the extraction layer and prints the
structured object. Works offline (mock mode) with no API key, so it's safe to
run live in a presentation. Set GEMINI_API_KEY to see real extraction.

Run:
    python demo.py
"""

from extract import extract_plan

SAMPLES = [
    "I'm in the MS CS program, already did Intro to Programming (CS101) and Data "
    "Structures (CS201). Starting Fall 2026, want to graduate by Spring 2028, max 9 "
    "credits a term but lighter in summers. Really into machine learning.",

    "hi im an undergrad comp sci major, i've finished CS 121 and MAT 131. i can only "
    "do like 6 credits per semester because i work part time. i want to focus on security.",
]


def main():
    for i, sample in enumerate(SAMPLES, 1):
        print(f"\n{'=' * 70}\nSAMPLE {i}\n{'=' * 70}")
        print(f"INPUT:\n{sample}\n")
        plan = extract_plan(sample)
        print("EXTRACTED OBJECT:")
        print(plan.model_dump_json(indent=2))


if __name__ == "__main__":
    main()