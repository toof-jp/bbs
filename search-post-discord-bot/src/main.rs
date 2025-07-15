use std::env;

use anyhow::Result;
use log::{debug, error, info};
use regex::Regex;
use search_post_discord_bot::{count_posts, parse_search_query, search_posts};
use serenity::async_trait;
use serenity::builder::{CreateEmbed, CreateMessage};
use serenity::model::channel::Message;
use serenity::model::gateway::Ready;
use serenity::prelude::*;

#[derive(Clone)]
struct Bot {
    api_base_url: String,
    image_url_prefix: String,
    default_limit: usize,
}

#[async_trait]
impl EventHandler for Bot {
    async fn message(&self, ctx: Context, msg: Message) {
        if msg.author.bot || !msg.mentions_me(&ctx.http).await.unwrap_or(false) {
            return;
        }

        // Remove mentions from content
        let content = msg.content.clone();
        let mention_regex = Regex::new(r"<@!?\d+>").unwrap();
        let cleaned_content = mention_regex.replace_all(&content, "").trim().to_string();

        if cleaned_content.is_empty() {
            if let Err(e) = msg
                .reply(
                    &ctx.http,
                    "使い方: @search 検索文字列\n例:\n- @search id:abc123\n- @search id:abc123 検索ワード\n- @search name_and_trip:名前\n- @search oekaki:true\n- @search since:2024-01-01 until:2024-12-31\n- @search limit:10 検索ワード\n- @search count:true 検索ワード",
                )
                .await
            {
                error!("Error sending help message: {e:?}");
            }
            return;
        }

        // Parse search query
        let query = parse_search_query(&cleaned_content);
        debug!("Parsed query from input: '{cleaned_content}'");

        // Only get count if count:true is specified
        let count_result = if query.count == Some(true) {
            Some(count_posts(&self.api_base_url, parse_search_query(&cleaned_content)).await)
        } else {
            None
        };

        match search_posts(&self.api_base_url, query, self.default_limit).await {
            Ok(posts) => {
                if posts.is_empty() {
                    let mut message = "検索結果が見つかりませんでした。".to_string();

                    if let Some(Ok(count)) = count_result {
                        if count.total_res_count > 0 {
                            message = format!(
                                "検索結果が見つかりませんでした。\n（該当件数: {}件、ユニークID数: {}）",
                                count.total_res_count, count.unique_id_count
                            );
                        }
                    }

                    if let Err(e) = msg.reply(&ctx.http, message).await {
                        error!("Error sending message: {e:?}");
                    }
                } else {
                    // Send count information first if count:true was specified
                    if let Some(Ok(count)) = count_result {
                        let count_message = format!(
                            "検索結果: {}件（表示: {}件）、ユニークID数: {}",
                            count.total_res_count,
                            posts.len(),
                            count.unique_id_count
                        );
                        if let Err(e) = msg.reply(&ctx.http, count_message).await {
                            error!("Error sending count message: {e:?}");
                        }
                    }

                    // Send posts with images if they have oekaki_id
                    let mut current_message = String::new();

                    for post in posts.iter() {
                        let post_text = format!("{post}");

                        // Check if adding this post would exceed Discord's limit
                        if !current_message.is_empty()
                            && current_message.chars().count() + post_text.chars().count() > 1800
                        {
                            // Send the current batch
                            if let Err(e) = msg.reply(&ctx.http, &current_message).await {
                                error!("Error sending message: {e:?}");
                            }
                            current_message.clear();
                        }

                        current_message.push_str(&post_text);

                        // Send image if oekaki_id exists
                        if let Some(oekaki_id) = post.oekaki_id {
                            // Send current text if any
                            if !current_message.is_empty() {
                                if let Err(e) = msg.reply(&ctx.http, &current_message).await {
                                    error!("Error sending message: {e:?}");
                                }
                                current_message.clear();
                            }

                            // Send image as embed
                            let image_url = format!("{}{}.png", self.image_url_prefix, oekaki_id);
                            let builder = CreateMessage::new()
                                .reference_message(&msg)
                                .embed(CreateEmbed::new().image(image_url));

                            if let Err(e) = msg.channel_id.send_message(&ctx.http, builder).await {
                                eprintln!("Error sending image: {e:?}");
                            }
                        }
                    }

                    // Send any remaining text
                    if !current_message.is_empty() {
                        if let Err(e) = msg.reply(&ctx.http, current_message).await {
                            error!("Error sending message: {e:?}");
                        }
                    }
                }
            }
            Err(e) => {
                error!("Search error: {e:?}");
                if let Err(e) = msg.reply(&ctx.http, "検索中にエラーが発生しました。").await
                {
                    error!("Error sending error message: {e:?}");
                }
            }
        }
    }

    async fn ready(&self, _: Context, ready: Ready) {
        info!("{} is connected!", ready.user.name);
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().expect("Failed to load .env file");

    // Initialize logger with RUST_LOG environment variable
    env_logger::init();

    let discord_token = env::var("DISCORD_TOKEN").expect("Expected DISCORD_TOKEN in environment");
    let api_base_url = env::var("API_BASE_URL").expect("Expected API_BASE_URL in environment");
    let image_url_prefix =
        env::var("IMAGE_URL_PREFIX").expect("Expected IMAGE_URL_PREFIX in environment");
    let default_limit = env::var("DEFAULT_LIMIT")
        .unwrap_or_else(|_| "5".to_string())
        .parse::<usize>()
        .expect("DEFAULT_LIMIT must be a valid number");

    let bot = Bot {
        api_base_url,
        image_url_prefix,
        default_limit,
    };

    let intents = GatewayIntents::GUILD_MESSAGES
        | GatewayIntents::DIRECT_MESSAGES
        | GatewayIntents::MESSAGE_CONTENT;

    let mut client = Client::builder(&discord_token, intents)
        .event_handler(bot)
        .await
        .expect("Error creating client");

    if let Err(why) = client.start().await {
        error!("Client error: {why:?}");
    }

    Ok(())
}
