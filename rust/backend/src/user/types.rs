use std::str::FromStr;

/// Unique user identifier
pub type UserId = u32;

/// Unique user account identifier
pub type AccountId = u32;

/// User id argument (or predicate)
#[derive(Debug)]
pub struct UserArg {
    pub user: UserId,
}

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
