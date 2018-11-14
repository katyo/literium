use base::TimeStamp;
use mail::MailAddress;
use std::str::FromStr;

/// Unique user identifier
pub type UserId = u32;

/// Unique user account identifier
pub type AccountId = u32;

/// Gender type
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum Gender {
    #[serde(rename = "male")]
    Male,
    #[serde(rename = "female")]
    Female,
}

impl FromStr for Gender {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "MALE" | "male" | "MAL" | "mal" | "M" | "m" | "MAN" | "man" => Ok(Gender::Male),
            "FEMALE" | "female" | "FEM" | "fem" | "F" | "f" | "WOMAN" | "woman" | "W" | "w" => {
                Ok(Gender::Female)
            }
            _ => Err(()),
        }
    }
}

/*
/// User personality information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Personality {
    pub ident: String,
    pub nick_name: Option<String>,
    pub given_name: Option<String>,
    pub middle_name: Option<String>,
    pub family_name: Option<String>,
    pub gender: Option<Gender>,
    pub birth_date: Option<TimeStamp>,
    pub locale: Option<String>,
    pub time_zone: Option<TimeStamp>,
    pub location: Option<String>,
    pub company: Option<String>,
    pub create_date: Option<TimeStamp>,
    pub email: Option<MailAddress>,
    pub link: Option<String>,
    pub image: Option<String>,
    pub about: Option<String>,
}

impl Personality {
    pub fn using_ident<S: Into<String>>(ident: S) -> Self {
        Personality {
            ident: ident.into(),
            nick_name: None,
            given_name: None,
            middle_name: None,
            family_name: None,
            gender: None,
            create_date: None,
            birth_date: None,
            locale: None,
            company: None,
            time_zone: None,
            location: None,
            email: None,
            link: None,
            image: None,
            about: None,
        }
    }
}
*/
