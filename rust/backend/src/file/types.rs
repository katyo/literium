/// Link to file on server
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct FileLink {
    /// Temporary identifier
    #[serde(default)]
    pub temp: Option<String>,

    /// File name
    pub name: String,
}

impl FileLink {
    /// File is temporary
    ///
    /// It means that file has uploaded but didn't saved in permanent storage.
    pub fn is_temporary(&self) -> bool {
        self.temp.is_some()
    }

    /// File is permanent
    ///
    /// It means that file has saved in permanent storage.
    pub fn is_permanent(&self) -> bool {
        self.temp.is_none()
    }

    /// Turns file to be permanent
    pub fn to_permanent(&mut self) {
        if self.is_temporary() {
            self.temp = None;
        }
    }
}
