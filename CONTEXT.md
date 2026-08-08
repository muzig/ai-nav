# AI Nav Product Context

AI Nav is a self-hosted bookmark navigation homepage. Its purpose is to keep saved tools easy to find, organize, and open; the bookmark library is the product center and the only primary workspace.

## Core model

**Tool bookmark**:
An external site or service saved for quick access. A bookmark has a URL, title, optional description and favicon, category, favorite state, and usage timestamps.
_Avoid_: Source, resource, document

**Category**:
A user-managed grouping used to organize bookmarks and provide the page outline.
_Avoid_: Workspace, project, collection

**Favorite**:
A bookmark promoted for quicker access. Favorites are ordered by recent use.

**Local service**:
A bookmark whose host points to localhost, a private network, or another local service address. It remains a normal bookmark and is only presented in a dedicated navigation shelf.

## Product boundary

- The homepage is the bookmark navigation library.
- AI is limited to URL metadata extraction and optional category suggestions.
- AI Nav does not contain research workspaces, sources, notes, a research assistant, or a learning studio.
- New features should strengthen bookmark capture, organization, search, and opening rather than introduce a second product model.
