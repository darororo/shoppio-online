export interface FacebookConversationResponse {
  id: string;
  updated_time: string;
}

export interface FacebookConversationsListResponse {
  data: FacebookConversationResponse[];
  paging?: {
    next?: string;
    previous?: string;
  };
}

export interface FacebookMessageResponse {
  id: string;
  created_time: string;
  from?: {
    username?: string;
    id: string;
    name?: string;
  };
  to?: {
    data: Array<{
      username?: string;
      id: string;
      name?: string;
    }>;
  };
  message?: string;
  attachments?: {
    data: Array<{
      id: string;
      mime_type: string;
      name: string;
      size: number;
    }>;
  };
}

export interface FacebookMessagesListResponse {
  data: Array<{
    id: string;
    created_time: string;
  }>;
  paging?: {
    next?: string;
    previous?: string;
  };
}

export interface FacebookConversationDetailsResponse {
  id: string;
  messages: FacebookMessagesListResponse;
}
