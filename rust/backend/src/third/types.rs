use base::EmptyMap;

#[derive(Serialize)]
pub struct ThirdApiParams<'a, T> {
    /// Access token
    pub access_token: &'a str,

    /// Extra service-specific parameters
    #[serde(flatten)]
    pub service_params: T,
}

impl<'a> ThirdApiParams<'a, EmptyMap> {
    pub fn new(access_token: &'a str) -> Self {
        Self {
            access_token,
            service_params: EmptyMap,
        }
    }

    pub fn with<T>(self, params: T) -> ThirdApiParams<'a, T> {
        ThirdApiParams {
            access_token: self.access_token,
            service_params: params,
        }
    }
}
