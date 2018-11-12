#[derive(Serialize)]
pub struct ThirdApiParams<'a> {
    pub access_token: &'a str,
}
