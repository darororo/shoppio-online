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
    profile_pic?: string;
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
      mime_type?: string;
      name?: string;
      size?: number;
      image_data?: {
        url: string;
        preview_url?: string;
        width?: number;
        height?: number;
      };
      video_data?: {
        url: string;
        preview_url?: string;
        width?: number;
        height?: number;
      };
      audio_data?: {
        url: string;
      };
      file_url?: string;
    }>;
  };
  sticker?: string | {
    id: string;
    url: string;
    pack?: {
      id: string;
      name?: string;
    };
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
