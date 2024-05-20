import json
import csv

file_name = "nifty"

with open(f"{file_name}.json") as json_in:
    data = json.load(json_in)

with open(f"{file_name}.csv", mode="w+", newline="") as csv_in:
    writer = csv.DictWriter(csv_in, fieldnames=data[0].keys())
    writer.writeheader()
    writer.writerows(data)
