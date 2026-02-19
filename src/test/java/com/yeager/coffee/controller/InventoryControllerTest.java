package com.yeager.coffee.controller;

import com.yeager.coffee.config.ApplicationConfig;
import com.yeager.coffee.config.SecurityConfig;
import com.yeager.coffee.repository.BeanRepository;
import com.yeager.coffee.repository.UserRepository;
import com.yeager.coffee.security.CustomUserDetailsService;
import com.yeager.coffee.security.JwtUtils;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InventoryController.class)
@Import({ SecurityConfig.class, ApplicationConfig.class })
public class InventoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BeanRepository beanRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    @Test
    public void getAvailableBeans_ShouldBePublic() throws Exception {
        mockMvc.perform(get("/api/beans"))
                .andExpect(status().isOk());
    }

    @Test
    public void createBean_ShouldRequireAuthentication() throws Exception {
        mockMvc.perform(post("/api/beans")
                .contentType("application/json")
                .content("{}")) // Invalid content but sufficient to trigger auth check
                .andExpect(status().isForbidden());
    }
}
