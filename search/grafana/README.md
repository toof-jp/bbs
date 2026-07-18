# Grafana 投稿量ダッシュボード

投稿量を公開するための Grafana 構成。匿名ユーザーは Viewer として閲覧でき、ダッシュボード上部のテキストボックスに ID を入力するとその ID の投稿量だけを表示する(空欄で全体)。

## パネル

- 期間内の投稿数 / ユニークID数
- 投稿数の推移(時系列、ID で絞り込み可)
- 投稿数ランキング Top 20
- 時間帯別の投稿数

## セットアップ

1. 読み取り専用 DB ユーザーを作る(`setup/readonly-user.sql` のパスワードを変更してから):

   ```bash
   psql "$DATABASE_URL" -f setup/readonly-user.sql
   ```

   匿名公開する Grafana からはデータソースに対して任意の SELECT が実行され得るため、
   crawler/backend 用のユーザーを使い回さず、必ずこの読み取り専用ユーザーを使うこと。

2. `datetime` インデックスのマイグレーションを適用する(`search/migrations/20260719000000_add_datetime_index.sql`)。

3. `.env` を用意して起動:

   ```bash
   cp .env.example .env
   # .env を編集
   docker compose up -d
   ```

4. `http://localhost:3000` を開くとログインなしでダッシュボードが表示される。
   編集は `GF_ADMIN_USER` / `GF_ADMIN_PASSWORD` でログインして行う。

公開する場合は Caddy / nginx などのリバースプロキシで HTTPS を終端し、`GF_ROOT_URL` にその URL を設定する。

## Kubernetes へのデプロイ

kustomize 構成(`kustomization.yaml` + `k8s/`)を用意してある。provisioning とダッシュボード JSON は ConfigMap として生成されるので、docker-compose 版と二重管理にならない。

1. 読み取り専用 DB ユーザーとマイグレーションは docker-compose 版と同じく事前に適用する。

2. `.env`(キーは `.env.example` と同じ)から Secret を作る:

   ```bash
   kubectl create namespace bbs-grafana
   kubectl create secret generic bbs-grafana-env -n bbs-grafana --from-env-file=.env
   ```

3. デプロイ:

   ```bash
   kubectl apply -k .
   ```

   home-kubernetes-private の `apps/grafana/` にはこのディレクトリをリモート base として参照する
   kustomization を置いてあるので、クラスタ側からは `kubectl apply -k apps/grafana` でもよい
   (このリポジトリの main に push 済みであること)。

Service は NodePort 30300 で公開している。Ingress やリバースプロキシで受ける場合は
`k8s/service.yaml` を ClusterIP に変更し、`GF_ROOT_URL` を公開 URL に合わせる。
Grafana の状態はすべてプロビジョニングで再現されるため `emptyDir` を使っており、PVC は不要。
ダッシュボードを変更したときは JSON を更新して `kubectl apply -k` し直せば ConfigMap の
ハッシュ付きの名前が変わり、自動でロールアウトされる。

## タイムゾーンについて

`res.datetime` は JST の壁時計時刻が timezone なしの `TIMESTAMP` として保存されている。
このためダッシュボードのタイムゾーンを `utc` に固定してあり、表示はそのまま JST の時刻として読める。
時間範囲の端(now 付近)は実時刻と最大 9 時間ずれるが、日次・月次の集計では実用上問題ない。

## ダッシュボードの変更

`dashboards/bbs-posts.json` がプロビジョニングで読み込まれる(UI からの保存は無効)。
UI で編集して JSON をエクスポートし、このファイルを更新してコミットする。
