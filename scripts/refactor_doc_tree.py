#!/usr/bin/env python3
"""
Deterministic refactor for RAG system doc_tree.jsonl.

Reads /Users/nitro/Downloads/doc_tree.jsonl (read-only) and produces:
  1. data/doc_tree/doc_tree_refactored.jsonl
  2. data/doc_tree/doc_tree_hierarchy.json
  3. docs/DOC_TREE_REFACTOR_REPORT.md
  4. src/data/ragDocTree.ts
"""

from __future__ import annotations

import json
import os
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

SOURCE_PATH = Path("/Users/nitro/Downloads/doc_tree.jsonl")
REPO_ROOT = Path(__file__).resolve().parent.parent

OUT_JSONL = REPO_ROOT / "data" / "doc_tree" / "doc_tree_refactored.jsonl"
OUT_HIERARCHY = REPO_ROOT / "data" / "doc_tree" / "doc_tree_hierarchy.json"
OUT_REPORT = REPO_ROOT / "docs" / "DOC_TREE_REFACTOR_REPORT.md"
OUT_TS = REPO_ROOT / "src" / "data" / "ragDocTree.ts"

# Explicit mapping for all non-bucketed legacy folders (102 + 1 bucketed = 103)
LEGACY_FOLDER_MAP: dict[str, str] = {
    # 01 · 品牌与商标图鉴 (brand_logos handled dynamically by letter bucket)
    "知识库/brand_sec": "01 · 品牌与商标图鉴/顶级奢侈与标杆品牌",
    "知识库/ent_奢侈品牌": "01 · 品牌与商标图鉴/顶级奢侈与标杆品牌",
    "知识库/ov": "01 · 品牌与商标图鉴/设计师与潮流时尚品牌",
    "知识库/ent_时尚品牌": "01 · 品牌与商标图鉴/时尚服饰与箱包品牌",
    "知识库/ent_服装品牌": "01 · 品牌与商标图鉴/时尚服饰与箱包品牌",
    "知识库/ent_服饰品牌": "01 · 品牌与商标图鉴/时尚服饰与箱包品牌",
    "知识库/ent_服饰箱包": "01 · 品牌与商标图鉴/时尚服饰与箱包品牌",
    "知识库/ent_运动品牌": "01 · 品牌与商标图鉴/运动与户外品牌",
    "知识库/ent_汽车": "01 · 品牌与商标图鉴/汽车与交通品牌",
    "知识库/ent_其他": "01 · 品牌与商标图鉴/消费与综合商业品牌",
    "知识库/ent_消费品牌": "01 · 品牌与商标图鉴/消费与综合商业品牌",
    "知识库/ent_餐饮品牌": "01 · 品牌与商标图鉴/消费与综合商业品牌",
    "知识库/brand": "01 · 品牌与商标图鉴/消费与综合商业品牌",
    "知识库/品牌标志图鉴 · S": "01 · 品牌与商标图鉴/消费与综合商业品牌",
    "知识库/ent_外观专利": "01 · 品牌与商标图鉴/消费与综合商业品牌",

    # 02 · 动漫、影视与娱乐 IP
    "知识库/宝可梦 · 第一世代": "02 · 动漫、影视与娱乐 IP/宝可梦专题/第一世代 · 关都",
    "知识库/pokemon_第一世代": "02 · 动漫、影视与娱乐 IP/宝可梦专题/第一世代 · 关都",
    "知识库/宝可梦 · 第二世代": "02 · 动漫、影视与娱乐 IP/宝可梦专题/第二世代 · 城都",
    "知识库/pokemon_第二世代": "02 · 动漫、影视与娱乐 IP/宝可梦专题/第二世代 · 城都",
    "知识库/宝可梦 · 第三世代": "02 · 动漫、影视与娱乐 IP/宝可梦专题/第三世代 · 丰缘",
    "知识库/pokemon_第三世代": "02 · 动漫、影视与娱乐 IP/宝可梦专题/第三世代 · 丰缘",
    "知识库/宝可梦 · 第四世代": "02 · 动漫、影视与娱乐 IP/宝可梦专题/第四世代 · 神奥",
    "知识库/pokemon_第四世代": "02 · 动漫、影视与娱乐 IP/宝可梦专题/第四世代 · 神奥",
    "知识库/宝可梦 · 第五世代": "02 · 动漫、影视与娱乐 IP/宝可梦专题/第五世代 · 合众",
    "知识库/pokemon_第五世代": "02 · 动漫、影视与娱乐 IP/宝可梦专题/第五世代 · 合众",
    "知识库/宝可梦 · 第六世代": "02 · 动漫、影视与娱乐 IP/宝可梦专题/第六世代 · 卡洛斯",
    "知识库/宝可梦 · 第七世代": "02 · 动漫、影视与娱乐 IP/宝可梦专题/第七世代 · 阿罗拉",
    "知识库/pokemon_第七世代": "02 · 动漫、影视与娱乐 IP/宝可梦专题/第七世代 · 阿罗拉",
    "知识库/宝可梦 · 第八世代": "02 · 动漫、影视与娱乐 IP/宝可梦专题/第八世代 · 伽勒尔",
    "知识库/pokemon_第八世代": "02 · 动漫、影视与娱乐 IP/宝可梦专题/第八世代 · 伽勒尔",
    "知识库/宝可梦 · 第九世代": "02 · 动漫、影视与娱乐 IP/宝可梦专题/第九世代 · 帕底亚",
    "知识库/pokemon_第九世代": "02 · 动漫、影视与娱乐 IP/宝可梦专题/第九世代 · 帕底亚",
    "知识库/pokemon_其他世代／形态": "02 · 动漫、影视与娱乐 IP/宝可梦专题/总览、人物与道具",
    "知识库/宝可梦 · 道具": "02 · 动漫、影视与娱乐 IP/宝可梦专题/总览、人物与道具",
    "知识库/宝可梦 · 人物": "02 · 动漫、影视与娱乐 IP/宝可梦专题/总览、人物与道具",
    "知识库/宝可梦 · 总 IP": "02 · 动漫、影视与娱乐 IP/宝可梦专题/总览、人物与道具",
    "知识库/宝可梦 · 组织": "02 · 动漫、影视与娱乐 IP/宝可梦专题/总览、人物与道具",

    "知识库/anime_char": "02 · 动漫、影视与娱乐 IP/动漫与漫画角色",
    "知识库/film_char": "02 · 动漫、影视与娱乐 IP/影视与动画角色",
    "知识库/影视角色": "02 · 动漫、影视与娱乐 IP/影视与动画角色",
    "知识库/其他动漫 ／ 游戏 IP": "02 · 动漫、影视与娱乐 IP/动漫与形象综合 IP",
    "知识库/ent_动漫IP": "02 · 动漫、影视与娱乐 IP/动漫与形象综合 IP",
    "知识库/ent_形象IP": "02 · 动漫、影视与娱乐 IP/动漫与形象综合 IP",
    "知识库/ent_玩具品牌／IP": "02 · 动漫、影视与娱乐 IP/动漫与形象综合 IP",
    "知识库/ent_游戏IP": "02 · 动漫、影视与娱乐 IP/游戏 IP",
    "知识库/ent_影视IP": "02 · 动漫、影视与娱乐 IP/影视作品与厂牌 IP",
    "知识库/ent_音乐人": "02 · 动漫、影视与娱乐 IP/音乐人、乐队与视觉艺术家",
    "知识库/ent_乐队": "02 · 动漫、影视与娱乐 IP/音乐人、乐队与视觉艺术家",
    "知识库/ent_乐队 ／ 音乐人": "02 · 动漫、影视与娱乐 IP/音乐人、乐队与视觉艺术家",
    "知识库/ent_音乐人 ／ 乐队": "02 · 动漫、影视与娱乐 IP/音乐人、乐队与视觉艺术家",
    "知识库/ent_视觉艺术家": "02 · 动漫、影视与娱乐 IP/音乐人、乐队与视觉艺术家",

    # 03 · 体育赛事、球队与机构
    "Sports/football_big5": "03 · 体育赛事、球队与机构/欧洲足球五大联赛",
    "Sports/us_pro_core": "03 · 体育赛事、球队与机构/北美职业体育 · 核心联盟 (NBA & NFL)",
    "Sports/us_pro_extended": "03 · 体育赛事、球队与机构/北美职业体育 · 扩展联盟 (MLB & NHL)",
    "Sports/ncaa": "03 · 体育赛事、球队与机构/NCAA 与高校联盟",
    "知识库/ent_院校": "03 · 体育赛事、球队与机构/NCAA 与高校联盟",
    "知识库/ent_球队": "03 · 体育赛事、球队与机构/综合球队与体育 IP",
    "知识库/ent_体育IP": "03 · 体育赛事、球队与机构/综合球队与体育 IP",
    "知识库/ent_体育娱乐IP": "03 · 体育赛事、球队与机构/综合球队与体育 IP",
    "知识库/ent_体育明星": "03 · 体育赛事、球队与机构/体育明星与公众人物",
    "知识库/ent_人物": "03 · 体育赛事、球队与机构/体育明星与公众人物",
    "知识库/ent_机构": "03 · 体育赛事、球队与机构/国际机构与赛事组织",
    "知识库/机构与赛事标志": "03 · 体育赛事、球队与机构/国际机构与赛事组织",

    # 04 · 国家旗帜与地理纹章
    "Logo库/flags": "04 · 国家旗帜与地理纹章/国家与地区旗帜",
    "Logo库/brand_logos+flags": "04 · 国家旗帜与地理纹章/国家与地区旗帜",
    "Logo库/geo+regional": "04 · 国家旗帜与地理纹章/地方行政区旗与地理标识",
    "Logo库/emblems+geo": "04 · 国家旗帜与地理纹章/国徽与官方纹章",
    "Logo库/geo": "04 · 国家旗帜与地理纹章/国徽与官方纹章",
    "知识库/国旗与国徽": "04 · 国家旗帜与地理纹章/旗帜纹章合规与速查指南",
    "知识库/国旗与国徽 · 徽章与标志": "04 · 国家旗帜与地理纹章/旗帜纹章合规与速查指南",

    # 05 · 视觉设计、纹样与工艺知识库
    "知识库/图案 · 纹样 · 材质 · 史前—古代": "05 · 视觉设计、纹样与工艺知识库/图案与纹样/史前—古代",
    "知识库/图案 · 纹样 · 材质 · 古典—中世纪": "05 · 视觉设计、纹样与工艺知识库/图案与纹样/古典—中世纪",
    "知识库/图案 · 纹样 · 材质 · 文艺复兴—18世纪": "05 · 视觉设计、纹样与工艺知识库/图案与纹样/文艺复兴—18世纪",
    "知识库/图案 · 纹样 · 材质 · 19世纪": "05 · 视觉设计、纹样与工艺知识库/图案与纹样/19世纪",
    "知识库/图案 · 纹样 · 材质 · 20世纪上半": "05 · 视觉设计、纹样与工艺知识库/图案与纹样/20世纪上半",
    "知识库/图案 · 纹样 · 材质 · 地域性传统工艺": "05 · 视觉设计、纹样与工艺知识库/图案与纹样/地域性传统纹样",
    "知识库/图案 · 纹样 · 材质 · 品牌视觉元素": "05 · 视觉设计、纹样与工艺知识库/品牌视觉元素与标识体系",
    "知识库/图案 · 纹样 · 材质 · 标识体系": "05 · 视觉设计、纹样与工艺知识库/品牌视觉元素与标识体系",
    "知识库/图案 · 纹样 · 材质 · 品类形制": "05 · 视觉设计、纹样与工艺知识库/品类形制与商品结构",
    "知识库/奢侈品牌 ／ 时尚": "05 · 视觉设计、纹样与工艺知识库/时尚与品类设计手册",
    "知识库/腕表": "05 · 视觉设计、纹样与工艺知识库/时尚与品类设计手册",
    "知识库/图案 · 纹样 · 材质 · 材质": "05 · 视觉设计、纹样与工艺知识库/材质、宝石与织物工艺",
    "知识库/图案 · 纹样 · 材质 · 工艺": "05 · 视觉设计、纹样与工艺知识库/材质、宝石与织物工艺",
    "知识库/lace": "05 · 视觉设计、纹样与工艺知识库/材质、宝石与织物工艺",
    "知识库/figure": "05 · 视觉设计、纹样与工艺知识库/设计史与艺术大师",
    "知识库/图案 · 纹样 · 材质": "05 · 视觉设计、纹样与工艺知识库/综合手册、实操与题库",
    "知识库/电商图片": "05 · 视觉设计、纹样与工艺知识库/综合手册、实操与题库",
    "知识库/题库": "05 · 视觉设计、纹样与工艺知识库/综合手册、实操与题库",

    # 06 · 审核规则与 Prompt 模板
    "知识库/audit_通用规则": "06 · 审核规则与 Prompt 模板/通用审核与风控规则",
    "知识库/audit_品牌／商标": "06 · 审核规则与 Prompt 模板/行业专项审核/品牌、商标与美妆",
    "知识库/audit_口红／彩妆": "06 · 审核规则与 Prompt 模板/行业专项审核/品牌、商标与美妆",
    "知识库/audit_动漫／游戏": "06 · 审核规则与 Prompt 模板/行业专项审核/动漫、影视与游戏",
    "知识库/audit_影视／角色": "06 · 审核规则与 Prompt 模板/行业专项审核/动漫、影视与游戏",
    "知识库/audit_院校／机构": "06 · 审核规则与 Prompt 模板/行业专项审核/体育、院校与机构",
    "知识库/audit_体育明星": "06 · 审核规则与 Prompt 模板/行业专项审核/体育、院校与机构",
    "知识库/audit_运动／球衣": "06 · 审核规则与 Prompt 模板/行业专项审核/体育、院校与机构",
    "知识库/audit_车型": "06 · 审核规则与 Prompt 模板/行业专项审核/汽车与车型",
    "知识库/audit_音乐／乐队": "06 · 审核规则与 Prompt 模板/行业专项审核/音乐与乐队",
    "知识库/audit_其他": "06 · 审核规则与 Prompt 模板/行业专项审核/综合专项与模型规则",
    "模版库": "06 · 审核规则与 Prompt 模板/标准化审核模板库",

    # 99 · 待清理与异常元数据
    "Logo库/brand_logos+emblems+flags+regional": "99 · 待清理与异常元数据",
    "Logo库/emblems": "99 · 待清理与异常元数据",
}

ANOMALY_LEGACY_FOLDERS = {
    "Logo库/brand_logos+emblems+flags+regional",
    "Logo库/emblems",
}

DOMAIN_DESCRIPTIONS = {
    "01 · 品牌与商标图鉴": "聚合标准品牌 Logo（按字母均匀分桶）、顶级奢侈品牌、设计师潮流品牌与各消费行业品牌图鉴。",
    "02 · 动漫、影视与娱乐 IP": "合并割裂的中英文宝可梦世代目录，并规整动漫角色、影视角色、游戏/影视 IP 及音乐视觉艺术家。",
    "03 · 体育赛事、球队与机构": "统一纳管欧洲足球五大联赛、北美职业联盟、NCAA 高校、体育明星及国际赛事机构。",
    "04 · 国家旗帜与地理纹章": "收敛各国国旗、地方行政区旗、国徽纹章与合规识别速查手册。",
    "05 · 视觉设计、纹样与工艺知识库": "按历史分期重构图案纹样，整合品牌视觉元素、商品品类形制、材质工艺与艺术大师手册。",
    "06 · 审核规则与 Prompt 模板": "收口零散的 audit_* 专项审核文档与标准化模版库，便于联调对比与跨库查重。",
    "99 · 待清理与异常元数据": "隔离扫描残留的 MANIFEST 索引及占位符等脏元数据条目，避免污染主检索树。",
}


def brand_logo_bucket(title: str, doc_id: str) -> str:
    raw = (title or doc_id or "").strip()
    if not raw:
        return "0–9 及其他"
    ch = raw[0].upper()
    if "A" <= ch <= "C":
        return "A–C"
    if "D" <= ch <= "G":
        return "D–G"
    if "H" <= ch <= "L":
        return "H–L"
    if "M" <= ch <= "P":
        return "M–P"
    if "Q" <= ch <= "S":
        return "Q–S"
    if "T" <= ch <= "Z":
        return "T–Z"
    return "0–9 及其他"


def map_folder(row: dict[str, Any]) -> str:
    legacy = row["folder"]
    if legacy == "Logo库/brand_logos":
        bucket = brand_logo_bucket(row.get("title", ""), row.get("doc_id", ""))
        return f"01 · 品牌与商标图鉴/品牌标准 Logo 索引/{bucket}"
    if legacy in LEGACY_FOLDER_MAP:
        return LEGACY_FOLDER_MAP[legacy]
    raise KeyError(f"Unmapped legacy folder: {legacy!r}")


def build_tree_node(name: str, full_path: str) -> dict[str, Any]:
    return {
        "name": name,
        "path": full_path,
        "count": 0,
        "matched": 0,
        "pending": 0,
        "unmatched": 0,
        "anomalyCount": 0,
        "origins": Counter(),
        "legacyFolders": Counter(),
        "samples": [],
        "children": {},
    }


def serialize_node(node: dict[str, Any], max_samples: int = 8) -> dict[str, Any]:
    children_list = [
        serialize_node(child, max_samples=max_samples)
        for child in sorted(node["children"].values(), key=lambda c: c["name"])
    ]
    out: dict[str, Any] = {
        "name": node["name"],
        "path": node["path"],
        "count": node["count"],
        "matched": node["matched"],
        "pending": node["pending"],
        "unmatched": node["unmatched"],
        "anomalyCount": node["anomalyCount"],
        "origins": dict(sorted(node["origins"].items())),
        "legacyFolders": [
            {"folder": k, "count": v}
            for k, v in node["legacyFolders"].most_common()
        ],
        "samples": node["samples"][:max_samples],
        "children": children_list,
    }
    if node["path"] in DOMAIN_DESCRIPTIONS:
        out["description"] = DOMAIN_DESCRIPTIONS[node["path"]]
    return out


def main() -> None:
    if not SOURCE_PATH.exists():
        raise FileNotFoundError(f"Source file not found: {SOURCE_PATH}")

    rows: list[dict[str, Any]] = []
    with SOURCE_PATH.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))

    title_to_ids: dict[str, list[str]] = defaultdict(list)
    for r in rows:
        title_to_ids[r["title"]].append(r["doc_id"])

    duplicate_groups = {
        t: ids for t, ids in title_to_ids.items() if len(ids) > 1
    }

    legacy_folders_seen: Counter[str] = Counter()
    new_folders_seen: Counter[str] = Counter()
    legacy_to_new: dict[str, Counter[str]] = defaultdict(Counter)

    refactored_rows: list[dict[str, Any]] = []
    root_children: dict[str, dict[str, Any]] = {}

    for r in rows:
        legacy = r["folder"]
        new_folder = map_folder(r)
        is_anomaly = legacy in ANOMALY_LEGACY_FOLDERS
        peers = [pid for pid in title_to_ids[r["title"]] if pid != r["doc_id"]]

        legacy_folders_seen[legacy] += 1
        new_folders_seen[new_folder] += 1
        legacy_to_new[legacy][new_folder] += 1

        new_row = {
            "doc_id": r["doc_id"],
            "title": r["title"],
            "origin": r["origin"],
            "domain": r["domain"],
            "status": r["status"],
            "folder": new_folder,
            "folder_path": new_folder.split("/"),
            "legacy_folder": legacy,
            "is_anomaly": is_anomaly,
            "duplicate_peers": peers,
        }
        refactored_rows.append(new_row)

        # Populate hierarchy
        parts = new_folder.split("/")
        cur_map = root_children
        running_path = ""
        for depth_idx, part in enumerate(parts):
            running_path = f"{running_path}/{part}" if running_path else part
            if part not in cur_map:
                cur_map[part] = build_tree_node(part, running_path)
            node = cur_map[part]
            node["count"] += 1
            st = r["status"]
            if st in ("matched", "pending", "unmatched"):
                node[st] += 1
            if is_anomaly:
                node["anomalyCount"] += 1
            node["origins"][r["origin"]] += 1
            node["legacyFolders"][legacy] += 1
            if depth_idx == len(parts) - 1 and len(node["samples"]) < 10:
                node["samples"].append(
                    {
                        "docId": r["doc_id"],
                        "title": r["title"],
                        "origin": r["origin"],
                        "status": st,
                        "legacyFolder": legacy,
                        "isAnomaly": is_anomaly,
                    }
                )
            cur_map = node["children"]

    assert len(refactored_rows) == len(rows), "Row count mismatch!"
    assert len(legacy_folders_seen) == 103, f"Expected 103 legacy folders, got {len(legacy_folders_seen)}"

    # Ensure output directories exist
    OUT_JSONL.parent.mkdir(parents=True, exist_ok=True)
    OUT_REPORT.parent.mkdir(parents=True, exist_ok=True)
    OUT_TS.parent.mkdir(parents=True, exist_ok=True)

    with OUT_JSONL.open("w", encoding="utf-8") as f:
        for row in refactored_rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")

    tree_nodes = [
        serialize_node(child)
        for child in sorted(root_children.values(), key=lambda c: c["name"])
    ]

    total_status = Counter(r["status"] for r in refactored_rows)
    total_origins = Counter(r["origin"] for r in refactored_rows)
    anomaly_rows = [r for r in refactored_rows if r["is_anomaly"]]

    hierarchy_payload = {
        "sourceFile": str(SOURCE_PATH),
        "totalDocs": len(refactored_rows),
        "legacyFolderCount": len(legacy_folders_seen),
        "newLeafFolderCount": len(new_folders_seen),
        "rootDomainCount": len(tree_nodes),
        "maxDepth": max(len(r["folder_path"]) for r in refactored_rows),
        "duplicateTitleGroupCount": len(duplicate_groups),
        "anomalyDocCount": len(anomaly_rows),
        "statusCounts": dict(total_status),
        "originCounts": dict(total_origins),
        "tree": tree_nodes,
    }

    with OUT_HIERARCHY.open("w", encoding="utf-8") as f:
        json.dump(hierarchy_payload, f, ensure_ascii=False, indent=2)

    # Generate concise TypeScript module for frontend explorer
    ts_content = (
        "export interface RagTreeSample {\n"
        "  docId: string;\n"
        "  title: string;\n"
        "  origin: 'kb' | 'logo' | 'sport' | 'tpl';\n"
        "  status: 'matched' | 'pending' | 'unmatched';\n"
        "  legacyFolder: string;\n"
        "  isAnomaly: boolean;\n"
        "}\n\n"
        "export interface RagTreeLegacySource {\n"
        "  folder: string;\n"
        "  count: number;\n"
        "}\n\n"
        "export interface RagTreeNode {\n"
        "  name: string;\n"
        "  path: string;\n"
        "  description?: string;\n"
        "  count: number;\n"
        "  matched: number;\n"
        "  pending: number;\n"
        "  unmatched: number;\n"
        "  anomalyCount: number;\n"
        "  origins: Record<string, number>;\n"
        "  legacyFolders: RagTreeLegacySource[];\n"
        "  samples: RagTreeSample[];\n"
        "  children: RagTreeNode[];\n"
        "}\n\n"
        "export interface RagTreeSummary {\n"
        "  totalDocs: number;\n"
        "  legacyFolderCount: number;\n"
        "  newLeafFolderCount: number;\n"
        "  rootDomainCount: number;\n"
        "  maxDepth: number;\n"
        "  duplicateTitleGroupCount: number;\n"
        "  anomalyDocCount: number;\n"
        "  statusCounts: { matched: number; pending: number; unmatched: number };\n"
        "  originCounts: Record<string, number>;\n"
        "}\n\n"
        f"export const RAG_TREE_SUMMARY: RagTreeSummary = {json.dumps({k: hierarchy_payload[k] for k in ['totalDocs', 'legacyFolderCount', 'newLeafFolderCount', 'rootDomainCount', 'maxDepth', 'duplicateTitleGroupCount', 'anomalyDocCount', 'statusCounts', 'originCounts']}, ensure_ascii=False, indent=2)};\n\n"
        f"export const RAG_REFACTORED_TREE: RagTreeNode[] = {json.dumps(tree_nodes, ensure_ascii=False, indent=2)};\n"
    )
    OUT_TS.write_text(ts_content, encoding="utf-8")

    # Build Markdown report with ASCII tree & full 103-folder mapping table
    ascii_lines: list[str] = ["RAG 文档树 (7,983 Docs)"]

    def walk_ascii(nodes: list[dict[str, Any]], prefix: str = "") -> None:
        for idx, n in enumerate(nodes):
            is_last = idx == len(nodes) - 1
            branch = "└── " if is_last else "├── "
            next_prefix = prefix + ("    " if is_last else "│   ")
            pct = round((n["matched"] / max(1, n["count"])) * 100)
            ascii_lines.append(
                f"{prefix}{branch}{n['name']} ({n['count']:,} | 已匹配 {pct}%)"
            )
            if n["children"]:
                walk_ascii(n["children"], next_prefix)

    walk_ascii(tree_nodes)

    mapping_rows: list[str] = []
    for legacy, cnt in legacy_folders_seen.most_common():
        targets = ", ".join(
            f"`{nf}` ({c})" for nf, c in legacy_to_new[legacy].most_common()
        )
        mapping_rows.append(f"| `{legacy}` | {cnt} | {targets} |")

    dup_preview_lines: list[str] = []
    for title, ids in sorted(
        duplicate_groups.items(), key=lambda item: -len(item[1])
    )[:20]:
        dup_preview_lines.append(f"- **{title}**: {', '.join(f'`{i}`' for i in ids)}")

    report = f"""# RAG 系统 `doc_tree.jsonl` 文件树状图重构报告

- **源文件**：`/Users/nitro/Downloads/doc_tree.jsonl`（只读未修改）
- **输出数据**：`data/doc_tree/doc_tree_refactored.jsonl`、`data/doc_tree/doc_tree_hierarchy.json`
- **文档总数**：`{len(refactored_rows):,}` 条（`kb`: {total_origins['kb']:,} · `logo`: {total_origins['logo']:,} · `tpl`: {total_origins['tpl']} · `sport`: {total_origins['sport']}）
- **目录收敛**：`{len(legacy_folders_seen)}` 个原始平铺目录 → **`{len(tree_nodes)}` 个一级业务根域 / `{len(new_folders_seen)}` 个叶子目录**（最大深度 **{hierarchy_payload['maxDepth']} 级**）
- **匹配状态**：已匹配 `{total_status['matched']:,}` · 待确认 `{total_status['pending']}` · 未配图 `{total_status['unmatched']:,}`

---

## 一、诊断发现的核心问题

1. **目录碎片化与长尾孤岛严重**：原有 103 个平铺目录中，有 **60 个目录样本数 ≤ 10**，其中 **19 个目录仅包含 1 条文档**（如 `ent_服装品牌`、`ent_服饰品牌`、`ent_服饰箱包` 被拆成 3 个单条目录）。
2. **中英文与命名规范双轨割裂**：
   - 宝可梦图鉴同时存在 `宝可梦 · 第X世代`（中文）和 `pokemon_第X世代`（英文）共 22 个重复目录；
   - `知识库/ov`、`知识库/figure`、`知识库/brand_sec`、`知识库/lace` 等内部代号未做业务可读化命名。
3. **单目录巨型膨胀**：`Logo库/brand_logos` 单节点堆叠 **3,509 条**（占全库 44%），直接渲染会导致前端树状组件卡顿、人工检索效率极低。
4. **脏元数据混入**：`Logo库/brand_logos+emblems+flags+regional` 下存在 `logo_MANIFEST`、`Logo库/emblems` 下存在 `logo_emblem` 占位条目。
5. **跨库精确重名冲突**：全库共有 **{len(duplicate_groups)} 组**完全相同标题的实体跨 `kb/audit_*`、`模版库`、`Logo库` 重复出现（涉及 {sum(len(v) for v in duplicate_groups.values())} 条记录）。

---

## 二、重构后标准树状结构

```text
{os.linesep.join(ascii_lines)}
```

---

## 三、异常数据与跨库重名清理建议

### 1. 隔离的异常元数据（{len(anomaly_rows)} 条，已标记 `is_anomaly: true`）
{chr(10).join(f"- `{r['doc_id']}` (`{r['title']}`) — 原目录 `{r['legacy_folder']}`" for r in anomaly_rows)}

### 2. 跨库精确重名实体抽样（共 {len(duplicate_groups)} 组，展示前 20 组）
> 已在 `doc_tree_refactored.jsonl` 中为每条记录写入 `duplicate_peers` 字段，建议后续由审核管线合并 `audit_*` 与 `模版库` 同名规则。

{chr(10).join(dup_preview_lines)}

---

## 四、全量目录映射对照表（103 个原始目录 → 重构目录）

| 原目录 (`legacy_folder`) | 文档数 | 重构目标路径 (`folder`) |
|---|---:|---|
{chr(10).join(mapping_rows)}
"""
    OUT_REPORT.write_text(report, encoding="utf-8")

    print(
        json.dumps(
            {
                "totalDocs": len(refactored_rows),
                "legacyFolderCount": len(legacy_folders_seen),
                "newLeafFolderCount": len(new_folders_seen),
                "rootDomainCount": len(tree_nodes),
                "maxDepth": hierarchy_payload["maxDepth"],
                "duplicateTitleGroupCount": len(duplicate_groups),
                "anomalyDocCount": len(anomaly_rows),
                "tsSizeBytes": OUT_TS.stat().st_size,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
