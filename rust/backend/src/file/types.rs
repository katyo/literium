#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct TempFile {
    /// Temporary name
    pub temp: String,
    /// Permanent name
    pub name: String,
}

#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct PermFile {
    /// File name
    pub name: String,
}

impl From<TempFile> for PermFile {
    fn from(file: TempFile) -> Self {
        PermFile { name: file.name }
    }
}

impl From<FileLink> for PermFile {
    fn from(file: FileLink) -> Self {
        match file {
            FileLink::Perm(file) => file,
            FileLink::Temp(file) => file.into(),
        }
    }
}

#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(untagged)]
pub enum FileLink {
    Temp(TempFile),
    Perm(PermFile),
}

impl FileLink {
    /// Checks if file is temporary
    pub fn is_temp(&self) -> bool {
        if let FileLink::Temp(_) = self {
            true
        } else {
            false
        }
    }

    /// Checks if file is permanent
    pub fn is_perm(&self) -> bool {
        !self.is_temp()
    }
}

impl AsRef<TempFile> for FileLink {
    fn as_ref(&self) -> &TempFile {
        if let FileLink::Temp(file) = self {
            file
        } else {
            panic!(
                "Attempt to get reference to temporary file when the file actually is permanent"
            );
        }
    }
}

impl AsRef<PermFile> for FileLink {
    fn as_ref(&self) -> &PermFile {
        if let FileLink::Perm(file) = self {
            file
        } else {
            panic!(
                "Attempt to get reference to permanent file when the file actually is temporary"
            );
        }
    }
}

impl From<TempFile> for FileLink {
    fn from(file: TempFile) -> Self {
        FileLink::Temp(file)
    }
}

impl From<PermFile> for FileLink {
    fn from(file: PermFile) -> Self {
        FileLink::Perm(file)
    }
}
