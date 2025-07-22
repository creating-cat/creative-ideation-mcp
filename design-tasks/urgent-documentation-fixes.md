# 緊急ドキュメント修正タスク

## タスク概要
- **作成日**: 2025-01-22
- **優先度**: 緊急（即座に対応）
- **推定工数**: 2-3時間
- **担当者**: 
- **期限**: 即座

## 問題の概要
現在のREADMEと実装の間に重大な不整合があり、ユーザーがREADMEを参考にツールを使用すると実行時エラーが発生する。

## 修正対象ファイル
- [ ] `README.md`
- [ ] `src/tools/generateIdeaCategories.ts` (確認のみ)

## 詳細タスク

### Task 1: パラメータ名の統一修正
- [ ] **1-1**: README内の `max_categories` を `target_categories` に修正
- [ ] **1-2**: README内の `max_options_per_category` を `target_options_per_category` に修正
- [ ] **1-3**: パラメータ説明の日本語化
- [ ] **1-4**: 実装との整合性確認

**修正箇所**:
```markdown
# 修正前
- `max_categories` (number, optional): Target number of categories as a guideline (default: 15, max: 30)
- `max_options_per_category` (number, optional): Target options per category as a guideline (default: 20, max: 50)

# 修正後  
- `target_categories` (number, optional): 生成カテゴリ数の目安 (10-30, default: 20)
- `target_options_per_category` (number, optional): 各カテゴリの選択肢数の目安 (10-200, default: 20)
```

### Task 2: 新機能パラメータの追加
- [ ] **2-1**: `randomize_selection` パラメータの説明追加
- [ ] **2-2**: `random_sample_size` パラメータの説明追加
- [ ] **2-3**: ランダムサンプリング機能の使用例追加

**追加内容**:
```markdown
- `randomize_selection` (boolean, optional): 選択肢をランダムに選択するか (default: false)
- `random_sample_size` (number, optional): ランダム選択時の最大出力数 (5-200, default: 10)
```

### Task 3: 制約値の修正
- [ ] **3-1**: `target_categories` のデフォルト値を15→20に修正
- [ ] **3-2**: `target_options_per_category` の最大値を50→200に修正
- [ ] **3-3**: 最小値の明記

### Task 4: 使用例の修正・追加
- [ ] **4-1**: 基本使用例のパラメータ名修正
- [ ] **4-2**: ランダムサンプリング使用例の追加
- [ ] **4-3**: JSON例の検証

**追加する使用例**:
```json
{
  "expert_role": "Webデザイナー",
  "target_subject": "企業サイトのリニューアル",
  "target_categories": 12,
  "target_options_per_category": 30,
  "randomize_selection": true,
  "random_sample_size": 15,
  "domain_context": "BtoB企業向けの信頼性重視"
}
```

### Task 5: パフォーマンス情報の修正
- [ ] **5-1**: API呼び出し数の計算式修正
- [ ] **5-2**: 処理時間見積もりの修正

**修正内容**:
```markdown
# 修正前
- **API Calls**: Approximately 31 API calls (1 + 15×2) for default settings

# 修正後
- **API呼び出し数**: 1 + 生成されたカテゴリ数 (例: カテゴリ20個の場合は21回)
- **処理時間**: 約 (1 + カテゴリ数) × 5-10秒
```

## 完了基準
- [ ] 全てのチェックボックスが完了
- [ ] README記載のパラメータで実際にツールが動作することを確認
- [ ] パラメータの制約値が実装と一致することを確認
- [ ] 使用例のJSONが有効であることを確認

## テスト手順
1. **パラメータ名テスト**
   ```json
   {
     "expert_role": "テストエンジニア",
     "target_subject": "テスト計画",
     "target_categories": 10,
     "target_options_per_category": 15
   }
   ```

2. **ランダムサンプリングテスト**
   ```json
   {
     "expert_role": "テストエンジニア", 
     "target_subject": "テスト計画",
     "randomize_selection": true,
     "random_sample_size": 5
   }
   ```

3. **制約値テスト**
   - 最小値・最大値での動作確認
   - 範囲外値でのエラー確認

## 注意事項
- この修正により既存ユーザーへの影響はない（実装は変更しない）
- READMEの修正のみで実装との整合性を取る
- 修正後は必ず実際の動作確認を行う

## 完了後のアクション
- [ ] `completed/urgent-documentation-fixes-YYYYMMDD.md` に移動
- [ ] 次フェーズ（品質向上タスク）の開始検討