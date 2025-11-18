use bbs_search_crawler::Board;
use niconico::{login, Credentials};
use aws_config::BehaviorVersion;
use aws_smithy_runtime::client::http::hyper_014::HyperClientBuilder;
use rustls::RootCertStore;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = sqlx::PgPool::connect(&database_url).await.unwrap();

    let s3_client = s3_client().await;
    let bucket_name = std::env::var("BUCKET_NAME").expect("BUCKET_NAME must be set");

    let credentials = envy::from_env::<Credentials>().unwrap();
    let user_session = login(credentials).await.unwrap();

    let mut board = Board::new("https://ch.nicovideo.jp/unkchanel/bbs", "ch2598430");

    board.seek_res(&pool, &user_session, &s3_client, &bucket_name).await;
}

// https://github.com/awsdocs/aws-doc-sdk-examples/tree/59404bb965cf37be6caadbd57a3656600d483393/rustv1/examples/tls
async fn s3_client() -> aws_sdk_s3::Client {
    // Let webpki load the Mozilla root certificates.
    let mut root_store = RootCertStore::empty();
    root_store.add_server_trust_anchors(webpki_roots::TLS_SERVER_ROOTS.0.iter().map(|ta| {
        rustls::OwnedTrustAnchor::from_subject_spki_name_constraints(
            ta.subject,
            ta.spki,
            ta.name_constraints,
        )
    }));

    // The .with_protocol_versions call is where we set TLS1.3. You can add rustls::version::TLS12 or replace them both with rustls::ALL_VERSIONS
    let config = rustls::ClientConfig::builder()
        .with_safe_default_cipher_suites()
        .with_safe_default_kx_groups()
        .with_protocol_versions(&[&rustls::version::TLS13])
        .expect("It looks like your system doesn't support TLS1.3")
        .with_root_certificates(root_store)
        .with_no_client_auth();

    // Finish setup of the rustls connector.
    let rustls_connector = hyper_rustls::HttpsConnectorBuilder::new()
        .with_tls_config(config)
        .https_only()
        .enable_http1()
        .enable_http2()
        .build();

    // See https://github.com/awslabs/smithy-rs/discussions/3022 for the HyperClientBuilder
    let http_client = HyperClientBuilder::new().build(rustls_connector);

    let aws_sdk_config = aws_config::defaults(BehaviorVersion::latest())
        .http_client(http_client)
        .load()
        .await;

    aws_sdk_s3::Client::new(&aws_sdk_config)
}
