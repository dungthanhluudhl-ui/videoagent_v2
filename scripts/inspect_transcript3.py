import json

data = json.load(open('input/transcript3.json', 'r', encoding='utf-8'))
dur = data.get('duration', 0)
print(f"Total audio duration: {dur:.2f}s ({int(dur*30)} frames)")
print("--- SEGMENTS ---")
for idx, seg in enumerate(data['segments']):
    print(f"Segment {idx+1}: [{seg['start']:.2f}s ({int(seg['start']*30)}f) -> {seg['end']:.2f}s ({int(seg['end']*30)}f)]")
    print(f"Text: {seg['text'].strip()}\n")
