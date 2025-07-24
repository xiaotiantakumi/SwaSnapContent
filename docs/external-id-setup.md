# Microsoft Entra External ID セットアップガイド

このガイドでは、SwaSnapContentアプリケーションをMicrosoft Entra External ID（外部テナント）で認証できるように設定する手順を説明します。

## 前提条件

- Microsoft Entra External IDテナントが作成済みであること
- Azure Static Web Appsのリソースが作成済みであること

## 設定手順

### 1. External IDアプリケーション登録

1. [Microsoft Entra管理センター](https://entra.microsoft.com)にアクセス
2. External IDテナントに切り替え
3. **アプリケーション** > **アプリの登録** > **新規登録**
4. 以下の情報を設定：
   - **名前**: SwaSnapContent
   - **サポートされているアカウントの種類**: この組織ディレクトリのみ
   - **リダイレクトURI**: `https://<your-app-name>.azurestaticapps.net/.auth/login/aad/callback`

### 2. クライアントシークレットの作成

1. 作成したアプリケーション登録を開く
2. **証明書とシークレット** > **新しいクライアント シークレット**
3. 説明を入力し、有効期限を選択
4. **値**をコピー（一度しか表示されません）

### 3. APIのアクセス許可設定

1. **APIのアクセス許可** > **アクセス許可の追加**
2. **Microsoft Graph** > **委任されたアクセス許可**
3. 以下を選択：
   - `openid`
   - `profile`
   - `email`
4. **アクセス許可の付与**をクリック

### 4. Azure Static Web Appsの環境変数設定

Azure PortalでStatic Web Appsリソースを開き、**構成**セクションで以下の環境変数を追加：

| 名前 | 値 |
|------|-----|
| `EXTERNAL_ID_CLIENT_ID` | アプリケーション（クライアント）ID |
| `EXTERNAL_ID_CLIENT_SECRET` | 手順2で作成したシークレットの値 |

### 5. staticwebapp.config.jsonの確認

プロジェクトの`staticwebapp.config.json`ファイルが以下のように設定されていることを確認：

```json
{
  "auth": {
    "identityProviders": {
      "azureActiveDirectory": {
        "registration": {
          "openIdIssuer": "https://swasnap.ciamlogin.com/swasnap.onmicrosoft.com/v2.0/",
          "clientIdSettingName": "EXTERNAL_ID_CLIENT_ID",
          "clientSecretSettingName": "EXTERNAL_ID_CLIENT_SECRET"
        }
      }
    }
  }
}
```

**注意**: この例では`swasnap`がExternal IDテナント名として使用されています。

### 6. ユーザーフローの設定（オプション）

External IDでカスタムユーザーフローを使用する場合：

1. External ID管理センターで**ユーザーフロー**を作成
2. サインアップ・サインインフローを設定
3. 必要な属性とクレームを構成

## トラブルシューティング

### 認証エラーが発生する場合

1. **Issuer URLの確認**: `ciamlogin.com`ドメインを使用していることを確認
2. **環境変数の確認**: Azure Static Web Appsに正しく設定されているか確認
3. **リダイレクトURIの確認**: アプリ登録とStatic Web AppsのURLが一致しているか確認

### ユーザーがサインインできない場合

1. External IDテナントでユーザーが作成されているか確認
2. ユーザーフローが正しく設定されているか確認
3. アプリケーションのアクセス許可が付与されているか確認

## 参考リンク

- [Microsoft Entra External ID ドキュメント](https://learn.microsoft.com/ja-jp/entra/external-id/)
- [Azure Static Web Apps カスタム認証](https://learn.microsoft.com/ja-jp/azure/static-web-apps/authentication-custom)
- [外部テナントでのカスタムURLドメインの有効化](https://learn.microsoft.com/ja-jp/entra/external-id/customers/how-to-custom-url-domain)