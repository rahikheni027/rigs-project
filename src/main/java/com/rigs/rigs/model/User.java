    package com.rigs.rigs.model;

    import jakarta.persistence.*;

    @Entity
    @Table(name = "users")
    public class User {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        private String name;

        @Column(unique = true)
        private String email;

        private String password;

        private Integer active = 1;
        private Integer enabled = 0;
        private String role = "USER";
        private String provider = "LOCAL";

        @Column(length = 6)
        private String verificationCode;

        // ===== GETTERS & SETTERS =====

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public Integer getActive() { return active; }
        public void setActive(Integer active) { this.active = active; }

        public Integer getEnabled() { return enabled; }
        public void setEnabled(Integer enabled) { this.enabled = enabled; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public String getProvider() { return provider; }
        public void setProvider(String provider) { this.provider = provider; }

        public String getVerificationCode() { return verificationCode; }
        public void setVerificationCode(String verificationCode) {
            this.verificationCode = verificationCode;
        }
    }
