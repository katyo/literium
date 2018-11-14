#[derive(Serialize)]
pub struct ThirdApiParams<'a, T> {
    /// Access token
    pub access_token: &'a str,

    /// Extra service-specific parameters
    #[serde(flatten)]
    pub service_params: T,
}

#[derive(Serialize)]
pub struct ThirdApiParamsEmpty {}

impl<'a> ThirdApiParams<'a, ThirdApiParamsEmpty> {
    pub fn new(access_token: &'a str) -> Self {
        Self {
            access_token,
            service_params: ThirdApiParamsEmpty {},
        }
    }

    pub fn with<T>(self, params: T) -> ThirdApiParams<'a, T> {
        ThirdApiParams {
            access_token: self.access_token,
            service_params: params,
        }
    }
}
