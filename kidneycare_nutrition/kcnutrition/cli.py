"""Command line: build the database, search foods, and calculate a meal log.

  python -m kcnutrition.cli build-db
  python -m kcnutrition.cli search "moong"
  python -m kcnutrition.cli calc examples/meals_example.csv --child examples/child_example.json \
      --md out/report.md --json out/result.json --fhir out/fhir.json
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from . import db_build
from .engine import Engine, FoodDB, read_meals_csv
from .report import fhir_bundle, markdown


def main(argv=None):
    p = argparse.ArgumentParser(prog="kcnutrition")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("build-db")
    s = sub.add_parser("search")
    s.add_argument("query")
    c = sub.add_parser("calc")
    c.add_argument("meals")
    c.add_argument("--child")
    c.add_argument("--md")
    c.add_argument("--json")
    c.add_argument("--fhir")
    args = p.parse_args(argv)

    if args.cmd == "build-db":
        print(f"Built {db_build.build()}")
        return 0
    if args.cmd == "search":
        for line in FoodDB().search(args.query, 20):
            print(line)
        return 0
    child = json.loads(Path(args.child).read_text(encoding="utf-8")) if args.child else None
    result = Engine().compute(read_meals_csv(Path(args.meals)), child)
    md = markdown(result)
    if args.md:
        Path(args.md).write_text(md, encoding="utf-8")
    if args.json:
        Path(args.json).write_text(json.dumps(result, indent=2, default=str), encoding="utf-8")
    if args.fhir:
        Path(args.fhir).write_text(json.dumps(fhir_bundle(result), indent=2), encoding="utf-8")
    if not (args.md or args.json or args.fhir):
        sys.stdout.write(md)
    return 1 if result["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
